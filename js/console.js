/* ==========================================================================
   Console — renders test previews, run progress, verdicts and stdout.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const ICON = {
    pass: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fail: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="12" height="12"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    chevron: '<svg class="chev" viewBox="0 0 24 24" width="14" height="14"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  };

  // Display a JS test arg the way Python would repr it (for the preview pane)
  const pyRepr = (v) => {
    if (typeof v === "string") {
      const s = v.length > 120 ? v.slice(0, 120) + "…" : v;
      return `'${s}'`;
    }
    if (Array.isArray(v)) {
      const s = "[" + v.map(pyRepr).join(", ") + "]";
      return s.length > 160 ? s.slice(0, 160) + "…]" : s;
    }
    return String(v);
  };
  const pyExpected = (t) => {
    if (t.raises) return `raises ${t.raises}`;
    if (t.tol !== undefined) return Number.isInteger(t.expected) ? t.expected.toFixed(1) : String(t.expected);
    return pyRepr(t.expected);
  };

  function verdictOf(res, mode) {
    if (res.timeout)
      return {
        kind: "error",
        title: "Time Limit Exceeded",
        sub: `Your code ran for more than ${res.limit / 1000}s. Check for an infinite loop. The Python runtime was restarted.`,
      };
    if (res.internalError) return { kind: "error", title: "Runtime Unavailable", sub: res.internalError };
    const r = res.result;
    if (r.error) return { kind: "error", title: r.errorKind || "Error", sub: "Your code failed before any test could run." };
    const total = r.results.length;
    const passed = r.results.filter((x) => x.passed).length;
    const ms = r.results.reduce((a, x) => a + (x.ms || 0), 0);
    const base = { passed, total, ms };
    if (passed === total)
      return mode === "submit"
        ? { ...base, kind: "ok", title: "Accepted", sub: `All ${total} test cases passed, including hidden edge cases.` }
        : { ...base, kind: "ok", title: "Visible tests passed", sub: "Now Submit to run the hidden test cases." };
    if (r.results.some((x) => !x.passed && x.error))
      return { ...base, kind: "error", title: "Runtime Error", sub: `${passed} / ${total} test cases passed.` };
    return { ...base, kind: "fail", title: "Wrong Answer", sub: `${passed} / ${total} test cases passed.` };
  }

  function block(label, value, cls = "") {
    return `<div class="io"><div class="io-label">${label}</div><pre class="io-val ${cls}">${esc(value)}</pre></div>`;
  }

  function caseRow(r, open) {
    const label = r.hidden ? `${ICON.lock} Hidden test ${r.index + 1}` : `Case ${r.index + 1}`;
    const ms = r.ms !== undefined ? `<span class="case-ms">${r.ms < 1 ? "<1" : r.ms.toFixed(1)} ms</span>` : "";
    const head = `<span class="case-icon">${r.passed ? ICON.pass : ICON.fail}</span><span class="case-label">${label}</span>${ms}`;

    // Passed hidden tests stay sealed; failing ones reveal their input to help debugging
    if (r.hidden && r.passed) return `<div class="case case-${r.passed ? "pass" : "fail"} sealed">${head}</div>`;

    let body = block("Input", r.input) + block("Output", r.output, r.passed ? "" : "val-bad") + block("Expected", r.expected, "val-good");
    if (r.note) body += `<div class="case-note">${esc(r.note)}</div>`;
    if (r.error) body += `<div class="io"><div class="io-label">Traceback</div><pre class="trace">${esc(r.error)}</pre></div>`;
    if (r.stdout) body += block("Stdout", r.stdout, "val-stdout");
    return `<details class="case case-${r.passed ? "pass" : "fail"}" ${open ? "open" : ""}><summary>${head}${ICON.chevron}</summary><div class="case-body">${body}</div></details>`;
  }

  function create({ testsEl, stdoutEl, stdoutCountEl }) {
    function setStdout(text) {
      if (text) {
        stdoutEl.innerHTML = `<pre class="stdout">${esc(text)}</pre>`;
        const lines = text.replace(/\n$/, "").split("\n").length;
        stdoutCountEl.textContent = lines;
        stdoutCountEl.hidden = false;
      } else {
        stdoutEl.innerHTML = `<div class="console-empty"><div class="ce-title">No output</div><div class="ce-sub"><code>print()</code> calls in your solution show up here.</div></div>`;
        stdoutCountEl.hidden = true;
      }
    }

    return {
      preview(mod) {
        const visible = mod.tests.filter((t) => !t.hidden);
        const hidden = mod.tests.length - visible.length;
        testsEl.innerHTML = `
          <div class="console-intro">
            <div class="ci-title">Test cases</div>
            <div class="ci-sub">Press <kbd>Run</kbd> to check these, or <kbd>Submit</kbd> to also run ${hidden} hidden edge case${hidden === 1 ? "" : "s"}.</div>
          </div>
          <div class="preview-list">
            ${visible
              .map(
                (t, i) => `
              <div class="preview-case">
                <div class="pc-head">Case ${i + 1}</div>
                <div class="pc-line"><span class="pc-k">${esc(mod.fnName)}(</span><span class="pc-v">${esc(t.args.map(pyRepr).join(", "))}</span><span class="pc-k">)</span></div>
                <div class="pc-line"><span class="pc-k">→</span> <span class="pc-v pc-exp">${esc(pyExpected(t))}</span></div>
              </div>`
              )
              .join("")}
            ${hidden ? `<div class="preview-case preview-hidden">${ICON.lock}<span>${hidden} hidden test${hidden === 1 ? "" : "s"}</span></div>` : ""}
          </div>`;
        setStdout("");
      },

      running(mode, waitingForRuntime) {
        testsEl.innerHTML = `
          <div class="console-running">
            <div class="spinner"></div>
            <div>
              <div class="cr-title">${waitingForRuntime ? "Starting the Python runtime…" : mode === "submit" ? "Judging submission…" : "Running visible tests…"}</div>
              <div class="cr-sub">${waitingForRuntime ? "The first load downloads Pyodide (~10 MB). Later runs are instant." : "Executing in a sandboxed WebAssembly interpreter"}</div>
            </div>
          </div>`;
      },

      /** Render a runner response. Returns the verdict object. */
      show(res, mode) {
        const v = verdictOf(res, mode);
        const r = res.result;
        const stats =
          v.total !== undefined
            ? `<div class="verdict-stats">
                 <div><span class="vs-k">Passed</span><span class="vs-v">${v.passed}/${v.total}</span></div>
                 <div><span class="vs-k">Runtime</span><span class="vs-v">${v.ms < 1 ? "<1" : v.ms.toFixed(1)} ms</span></div>
               </div>`
            : "";
        const bar =
          v.total !== undefined
            ? `<div class="verdict-bar">${r.results.map((x) => `<i class="${x.passed ? "ok" : "bad"}"></i>`).join("")}</div>`
            : "";

        let html = `
          <div class="verdict verdict-${v.kind}">
            <div class="verdict-main">
              <div class="verdict-title">${v.kind === "ok" ? ICON.pass : ICON.fail}<span>${esc(v.title)}</span></div>
              <div class="verdict-sub">${esc(v.sub)}</div>
            </div>
            ${stats}
          </div>${bar}`;

        if (r && r.error) {
          html += `<pre class="trace trace-lg">${esc(r.error)}</pre>`;
        } else if (r) {
          const firstFail = r.results.findIndex((x) => !x.passed);
          html += `<div class="cases">${r.results.map((x, i) => caseRow(x, i === firstFail)).join("")}</div>`;
        }
        testsEl.innerHTML = html;
        setStdout(r ? r.stdout : "");
        return v;
      },

      clear: setStdout,
    };
  }

  CBB.Console = { create };
})();
