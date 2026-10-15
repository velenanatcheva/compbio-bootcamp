/* ==========================================================================
   App — routing, layout, persistence and the Run/Submit flow.
   ========================================================================== */
(function () {
  const { Store, Runner, MODULES, Visuals, Editor, Console } = window.CBB;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const ui = {
    nav: $("#moduleNav"),
    lesson: $("#lessonView"),
    problem: $("#problemView"),
    leftBody: $("#leftBody"),
    runBtn: $("#runBtn"),
    submitBtn: $("#submitBtn"),
    pyStatus: $("#pyStatus"),
    saveIndicator: $("#saveIndicator"),
  };

  let current = null;
  let vizInstances = [];
  let busy = false;
  let saveTimer = null;

  const consoleView = Console.create({
    testsEl: $("#consoleTests"),
    stdoutEl: $("#consoleStdout"),
    stdoutCountEl: $("#stdoutCount"),
  });

  const editor = Editor.create($("#editorHost"), {
    onChange: (value) => scheduleSave(value),
    onRun: () => execute("run"),
    onSubmit: () => execute("submit"),
  });

  /* ───────────── Toasts ───────────── */
  function toast(html, kind = "info", ms = 3200) {
    const el = document.createElement("div");
    el.className = `toast toast-${kind}`;
    el.innerHTML = html;
    $("#toasts").appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    setTimeout(() => {
      el.classList.remove("in");
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  /* ───────────── Sidebar ───────────── */
  function renderSidebar() {
    ui.nav.innerHTML = MODULES.map((m) => {
      const solved = Store.isSolved(m.id);
      return `
        <a class="nav-item ${current && current.id === m.id ? "active" : ""} ${solved ? "solved" : ""}" href="#/${m.id}">
          <span class="nav-num">${solved ? '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : m.number}</span>
          <span class="nav-text">
            <span class="nav-title">${m.short}</span>
            <span class="nav-meta"><span class="diff diff-${m.difficulty.toLowerCase()}">${m.difficulty}</span> · ${m.minutes} min</span>
          </span>
        </a>`;
    }).join("");
    const done = MODULES.filter((m) => Store.isSolved(m.id)).length;
    $("#progressCount").textContent = `${done} / ${MODULES.length}`;
    $("#progressFill").style.width = `${(done / MODULES.length) * 100}%`;
  }

  /* ───────────── Lesson & Problem ───────────── */
  function navFooter(mod) {
    const idx = MODULES.indexOf(mod);
    const prev = MODULES[idx - 1];
    const next = MODULES[idx + 1];
    return `
      <div class="doc-nav">
        ${prev ? `<a class="doc-nav-link" href="#/${prev.id}"><span class="dn-k">← Previous</span><span class="dn-v">${prev.title}</span></a>` : "<span></span>"}
        ${next ? `<a class="doc-nav-link next" href="#/${next.id}"><span class="dn-k">Next →</span><span class="dn-v">${next.title}</span></a>` : `<div class="doc-nav-end">🎓 Final module of the course</div>`}
      </div>`;
  }

  function renderLesson(mod) {
    vizInstances.forEach((v) => v && v.destroy && v.destroy());
    vizInstances = [];
    ui.lesson.innerHTML =
      mod.lesson +
      `<div class="cta-card">
         <div><div class="cta-title">Ready to code?</div><div class="cta-sub">Implement <code>${mod.fnName}()</code> in the editor →</div></div>
         <button class="btn btn-primary btn-sm" data-goto="problem">Open problem</button>
       </div>` +
      navFooter(mod);
    Editor.highlight(ui.lesson);
    $$("[data-viz]", ui.lesson).forEach((el) => {
      const factory = Visuals[el.dataset.viz];
      if (factory) vizInstances.push(factory(el));
    });
  }

  function renderProblem(mod) {
    const p = mod.problem;
    const solved = Store.isSolved(mod.id);
    ui.problem.innerHTML = `
      <p class="eyebrow">Module ${mod.number} · Coding challenge</p>
      <div class="problem-head">
        <h1>${mod.number}. ${mod.fnName}</h1>
        <div class="problem-meta">
          <span class="diff diff-${mod.difficulty.toLowerCase()}">${mod.difficulty}</span>
          ${mod.topics.map((t) => `<span class="tag">${t}</span>`).join("")}
          ${solved ? '<span class="tag tag-solved">✓ Solved</span>' : ""}
        </div>
      </div>
      <div class="problem-statement">${p.statement}</div>
      ${p.examples
        .map(
          (ex, i) => `
        <div class="example">
          <div class="example-title">Example ${i + 1}</div>
          <div class="example-body">
            <div><span class="ex-k">Input:</span> <code class="ex-v">${ex.input.replace(/\n/g, "<br>")}</code></div>
            <div><span class="ex-k">Output:</span> <code class="ex-v">${ex.output}</code></div>
            ${ex.explanation ? `<div><span class="ex-k">Explanation:</span> ${ex.explanation}</div>` : ""}
          </div>
        </div>`
        )
        .join("")}
      <h3>Constraints</h3>
      <ul class="constraints">${p.constraints.map((c) => `<li>${c}</li>`).join("")}</ul>
      <h3>Hints</h3>
      <div class="hints">
        ${p.hints.map((h, i) => `<details class="hint"><summary>💡 Hint ${i + 1}</summary><div>${h}</div></details>`).join("")}
      </div>
      <div class="solution-box">
        <details class="hint solution" ${solved ? "" : 'data-locked="1"'}>
          <summary>🔑 Reference solution ${solved ? "" : '<span class="muted small">(try it yourself first)</span>'}</summary>
          <pre class="code" data-lang="python">${mod.solution.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>
        </details>
      </div>
      <div class="cta-card">
        <div><div class="cta-title">Need the background?</div><div class="cta-sub">The lesson covers the biology and the algorithm.</div></div>
        <button class="btn btn-sm" data-goto="lesson">Back to lesson</button>
      </div>`;
    Editor.highlight(ui.problem);
    const sol = $(".solution", ui.problem);
    sol.addEventListener("toggle", () => {
      if (sol.open && sol.dataset.locked && !confirm("Reveal the reference solution? You'll learn more by trying first, but it's here if you're stuck.")) {
        sol.open = false;
      } else if (sol.open) {
        delete sol.dataset.locked;
      }
    });
  }

  function setTab(tab) {
    $$(".pane-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    ui.lesson.hidden = tab !== "lesson";
    ui.problem.hidden = tab !== "problem";
    ui.leftBody.scrollTop = 0;
    Store.setUI("tab:" + (current ? current.id : ""), tab);
  }

  function setConsoleTab(tab) {
    $$(".console-tab").forEach((b) => b.classList.toggle("active", b.dataset.ctab === tab));
    $("#consoleTests").hidden = tab !== "tests";
    $("#consoleStdout").hidden = tab !== "stdout";
  }

  /* ───────────── Routing ───────────── */
  function route() {
    const id = (location.hash.match(/^#\/(m\d+)/) || [])[1];
    const mod = MODULES.find((m) => m.id === id) || MODULES.find((m) => m.id === Store.getLast()) || MODULES[0];
    if (!id || id !== mod.id) {
      history.replaceState(null, "", `#/${mod.id}`);
    }
    openModule(mod);
  }

  function openModule(mod) {
    if (current && current.id === mod.id) return;
    flushSave();
    current = mod;
    Store.setLast(mod.id);
    document.title = `${mod.short} · CompBio Bootcamp`;

    $("#crumbModule").textContent = `Module ${mod.number}`;
    $("#crumbTitle").textContent = mod.title;
    const badge = $("#crumbDifficulty");
    badge.textContent = mod.difficulty;
    badge.className = `badge diff diff-${mod.difficulty.toLowerCase()}`;

    renderSidebar();
    renderLesson(mod);
    renderProblem(mod);
    setTab(Store.getUI("tab:" + mod.id, "lesson"));

    const saved = Store.getCode(mod.id);
    editor.load(mod.id, saved !== null ? saved : mod.starter);
    ui.saveIndicator.textContent = "Saved";
    ui.saveIndicator.classList.remove("dirty");

    consoleView.preview(mod);
    setConsoleTab("tests");
    closeSidebar();
  }

  /* ───────────── Persistence ───────────── */
  function scheduleSave() {
    ui.saveIndicator.textContent = "Saving…";
    ui.saveIndicator.classList.add("dirty");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 400);
  }

  function flushSave() {
    if (!saveTimer || !current) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    const ok = Store.saveCode(current.id, editor.getValue());
    ui.saveIndicator.textContent = ok ? "Saved" : "Not saved (storage blocked)";
    ui.saveIndicator.classList.remove("dirty");
  }

  /* ───────────── Run / Submit ───────────── */
  async function execute(mode) {
    if (busy || !current) return;
    if (Runner.status.state === "error") {
      toast("Python runtime failed to load. Retrying…", "error");
      Runner.retry();
    }
    busy = true;
    flushSave();
    const mod = current;
    const tests = mode === "submit" ? mod.tests : mod.tests.filter((t) => !t.hidden);
    setButtonsBusy(mode);
    setConsoleTab("tests");
    consoleView.running(mode, !Runner.isReady);

    const res = await Runner.run(editor.getValue(), mod.fnName, tests);
    busy = false;
    setButtonsBusy(null);
    if (current !== mod) return; // learner navigated away mid-run

    const verdict = consoleView.show(res, mode);
    if (mode === "submit") {
      Store.bumpAttempts(mod.id);
      if (verdict.kind === "ok") {
        const first = Store.markSolved(mod.id);
        renderSidebar();
        renderProblem(mod);
        celebrate(mod, first);
      }
    }
  }

  function celebrate(mod, first) {
    const idx = MODULES.indexOf(mod);
    const next = MODULES[idx + 1];
    const tests = $("#consoleTests");
    tests.insertAdjacentHTML(
      "afterbegin",
      `<div class="next-card">
         <div class="next-emoji">${next ? "🧬" : "🎓"}</div>
         <div class="next-text">
           <div class="next-title">${next ? `Module ${mod.number} complete!` : "Bootcamp complete!"}</div>
           <div class="next-sub">${next ? `Up next: <b>${next.title}</b>` : "You've finished every module. You're ready for Rosalind's Bioinformatics Stronghold."}</div>
         </div>
         ${next ? `<a class="btn btn-primary btn-sm" href="#/${next.id}">Continue →</a>` : ""}
       </div>`
    );
    if (first) {
      toast(`<b>Accepted!</b> ${mod.short} solved · ${Store.solvedCount()}/${MODULES.length} complete`, "success", 4200);
      confetti();
    }
  }

  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = document.createElement("div");
    host.className = "confetti";
    const colors = ["#4ade80", "#f87171", "#fbbf24", "#60a5fa", "#c084fc", "#7c5cff"];
    for (let k = 0; k < 70; k++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[k % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + "s";
      p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      p.style.setProperty("--dx", (Math.random() - 0.5) * 240 + "px");
      p.style.setProperty("--r", Math.random() * 720 + "deg");
      host.appendChild(p);
    }
    document.body.appendChild(host);
    setTimeout(() => host.remove(), 3400);
  }

  function setButtonsBusy(mode) {
    ui.runBtn.disabled = ui.submitBtn.disabled = Boolean(mode);
    ui.runBtn.classList.toggle("loading", mode === "run");
    ui.submitBtn.classList.toggle("loading", mode === "submit");
  }

  /* ───────────── Python status pill ───────────── */
  Runner.onStatus(({ state, detail }) => {
    ui.pyStatus.dataset.state = state;
    const text = $(".py-text", ui.pyStatus);
    if (state === "loading") text.textContent = detail || "Loading Python…";
    else if (state === "ready") text.textContent = `${detail} · Ready`;
    else if (state === "running") text.textContent = "Running…";
    else {
      text.textContent = "Runtime error · Retry";
      ui.pyStatus.title = detail;
    }
  });
  ui.pyStatus.addEventListener("click", () => {
    if (Runner.status.state === "error") Runner.retry();
  });

  /* ───────────── Resizable panes ───────────── */
  function makeResizable(gutter, axis, apply, key) {
    gutter.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      gutter.setPointerCapture(e.pointerId);
      document.body.classList.add(axis === "x" ? "resizing-x" : "resizing-y");
      const move = (ev) => apply(ev);
      const up = () => {
        gutter.removeEventListener("pointermove", move);
        gutter.removeEventListener("pointerup", up);
        document.body.classList.remove("resizing-x", "resizing-y");
        editor.refresh();
        Store.setUI(key, gutter.dataset.value);
      };
      gutter.addEventListener("pointermove", move);
      gutter.addEventListener("pointerup", up);
    });
  }

  function applyLeftWidth(pct) {
    pct = Math.max(25, Math.min(70, pct));
    $("#paneLeft").style.flexBasis = pct + "%";
    $("#gutterX").dataset.value = pct;
  }
  function applyEditorHeight(pct) {
    pct = Math.max(20, Math.min(85, pct));
    $("#editorPanel").style.flexBasis = pct + "%";
    $("#gutterY").dataset.value = pct;
  }

  makeResizable(
    $("#gutterX"),
    "x",
    (e) => {
      const r = $("#workspace").getBoundingClientRect();
      applyLeftWidth(((e.clientX - r.left) / r.width) * 100);
    },
    "leftWidth"
  );
  makeResizable(
    $("#gutterY"),
    "y",
    (e) => {
      const r = $("#paneRight").getBoundingClientRect();
      applyEditorHeight(((e.clientY - r.top) / r.height) * 100);
      editor.refresh();
    },
    "editorHeight"
  );
  applyLeftWidth(+Store.getUI("leftWidth", 46));
  applyEditorHeight(+Store.getUI("editorHeight", 60));

  /* ───────────── Mobile sidebar ───────────── */
  const openSidebar = () => document.body.classList.add("sidebar-open");
  const closeSidebar = () => document.body.classList.remove("sidebar-open");
  $("#menuBtn").addEventListener("click", openSidebar);
  $("#scrim").addEventListener("click", closeSidebar);

  /* ───────────── Wiring ───────────── */
  $$(".pane-tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  $$(".console-tab").forEach((b) => b.addEventListener("click", () => setConsoleTab(b.dataset.ctab)));
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-goto]");
    if (go) setTab(go.dataset.goto);
  });

  ui.runBtn.addEventListener("click", () => execute("run"));
  ui.submitBtn.addEventListener("click", () => execute("submit"));

  $("#resetCodeBtn").addEventListener("click", () => {
    if (!current) return;
    if (!confirm("Reset the editor to the starter code? (You can undo with ⌘/Ctrl+Z)")) return;
    editor.setValue(current.starter);
    editor.focus();
  });
  $("#clearConsoleBtn").addEventListener("click", () => current && consoleView.preview(current));
  $("#resetAllBtn").addEventListener("click", () => {
    if (!confirm("Erase all saved code and progress for every module? This cannot be undone.")) return;
    Store.resetAll();
    location.hash = "#/m1";
    location.reload();
  });

  // Global shortcuts (work even when focus is outside the editor)
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.target.closest(".CodeMirror, .editor-fallback")) {
      e.preventDefault();
      execute(e.shiftKey ? "submit" : "run");
    }
  });

  if (!isMac) $$("kbd[data-mod]").forEach((k) => (k.textContent = "Ctrl"));
  window.addEventListener("beforeunload", flushSave);
  window.addEventListener("hashchange", route);

  renderSidebar();
  route();
  Runner.boot();
})();
