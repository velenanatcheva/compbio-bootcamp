/* ==========================================================================
   Console — renders test previews, run progress, verdicts and stdout.
   The panel itself is LTR (test data, tracebacks, stdout); Hebrew phrases
   are wrapped in .he spans so they keep correct RTL punctuation.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const he = (html) => `<span class="he" dir="rtl">${html}</span>`;

  const ICON = {
    pass: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fail: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="12" height="12"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    chevron: '<svg class="chev" viewBox="0 0 24 24" width="14" height="14"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  };

  const ERROR_KIND = {
    "Compile Error": "שגיאת תחביר",
    "Runtime Error": "שגיאת זמן ריצה",
    "Missing Function": "הפונקציה לא הוגדרה",
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

  function noteText(note) {
    if (!note) return "";
    if (note.code === "no-raise") return `ציפינו שהפונקציה תזרוק <code>${esc(note.exc)}</code>, אבל היא חזרה כרגיל.`;
    if (note.code === "wrong-type") return `הערך נכון אבל הטיפוס שגוי: התקבל <code>${esc(note.got)}</code>, נדרש <code>${esc(note.want)}</code>.`;
    if (note.code === "returned-none") return `הפונקציה החזירה <code>None</code>. אולי שכחתם משפט <code>return</code>?`;
    return esc(String(note));
  }

  function verdictOf(res, mode) {
    if (res.timeout)
      return {
        kind: "error",
        title: "חריגה ממגבלת הזמן",
        sub: `הקוד רץ יותר מ-${res.limit / 1000} שניות. בדקו אם יש לולאה אינסופית. סביבת Python הופעלה מחדש.`,
      };
    if (res.internalError) return { kind: "error", title: "סביבת Python אינה זמינה", sub: esc(res.internalError) };
    const r = res.result;
    if (r.error) {
      const missing = r.errorKind === "Missing Function";
      return {
        kind: "error",
        title: ERROR_KIND[r.errorKind] || "שגיאה",
        sub: missing
          ? `לא נמצאה פונקציה בשם המבוקש. הגדירו אותה ברמה העליונה של הקובץ עם <code>def</code>.`
          : "הקוד נכשל עוד לפני שבדיקה כלשהי רצה.",
      };
    }
    const total = r.results.length;
    const passed = r.results.filter((x) => x.passed).length;
    const ms = r.results.reduce((a, x) => a + (x.ms || 0), 0);
    const base = { passed, total, ms };
    if (passed === total)
      return mode === "submit"
        ? { ...base, kind: "ok", title: "התקבל", sub: `כל ${total} הבדיקות עברו, כולל מקרי הקצה הנסתרים.` }
        : { ...base, kind: "ok", title: "הבדיקות הגלויות עברו", sub: "עכשיו לחצו הגשה כדי להריץ גם את הבדיקות הנסתרות." };
    if (r.results.some((x) => !x.passed && x.error))
      return { ...base, kind: "error", title: "שגיאת זמן ריצה", sub: `${passed} מתוך ${total} בדיקות עברו.` };
    return { ...base, kind: "fail", title: "תשובה שגויה", sub: `${passed} מתוך ${total} בדיקות עברו.` };
  }

  function block(label, value, cls = "") {
    return `<div class="io"><div class="io-label">${label}</div><pre class="io-val ${cls}" dir="ltr">${esc(value)}</pre></div>`;
  }

  function caseRow(r, open) {
    const label = r.hidden ? `${ICON.lock} ${he(`בדיקה נסתרת ${r.index + 1}`)}` : he(`מקרה ${r.index + 1}`);
    const ms = r.ms !== undefined ? `<span class="case-ms">${r.ms < 1 ? "<1" : r.ms.toFixed(1)} ms</span>` : "";
    const head = `<span class="case-icon">${r.passed ? ICON.pass : ICON.fail}</span><span class="case-label">${label}</span>${ms}`;

    // Passed hidden tests stay sealed; failing ones reveal their input to help debugging
    if (r.hidden && r.passed) return `<div class="case case-pass sealed">${head}</div>`;

    let body =
      block(he("קלט"), r.input) +
      block(he("פלט"), r.output, r.passed ? "" : "val-bad") +
      block(he("צפוי"), r.expected, "val-good");
    if (r.note) body += `<div class="case-note" dir="rtl">${noteText(r.note)}</div>`;
    if (r.error) body += `<div class="io"><div class="io-label">Traceback</div><pre class="trace" dir="ltr">${esc(r.error)}</pre></div>`;
    if (r.stdout) body += block("Stdout", r.stdout, "val-stdout");
    return `<details class="case case-${r.passed ? "pass" : "fail"}" ${open ? "open" : ""}><summary>${head}${ICON.chevron}</summary><div class="case-body">${body}</div></details>`;
  }

  function create({ testsEl, stdoutEl, stdoutCountEl }) {
    function setStdout(text) {
      if (text) {
        stdoutEl.innerHTML = `<pre class="stdout" dir="ltr">${esc(text)}</pre>`;
        const lines = text.replace(/\n$/, "").split("\n").length;
        stdoutCountEl.textContent = lines;
        stdoutCountEl.hidden = false;
      } else {
        stdoutEl.innerHTML = `<div class="console-empty" dir="rtl"><div class="ce-title">אין פלט</div><div class="ce-sub">קריאות <code>print()</code> בפתרון שלכם יופיעו כאן.</div></div>`;
        stdoutCountEl.hidden = true;
      }
    }

    return {
      preview(mod) {
        const visible = mod.tests.filter((t) => !t.hidden);
        const hidden = mod.tests.length - visible.length;
        testsEl.innerHTML = `
          <div class="console-intro" dir="rtl">
            <div class="ci-title">מקרי בדיקה</div>
            <div class="ci-sub">לחצו <kbd>הרצה</kbd> כדי לבדוק אותם, או <kbd>הגשה</kbd> כדי להריץ גם ${hidden === 1 ? "מקרה קצה נסתר אחד" : `${hidden} מקרי קצה נסתרים`}.</div>
          </div>
          <div class="preview-list">
            ${visible
              .map(
                (t, i) => `
              <div class="preview-case">
                <div class="pc-head">${he(`מקרה ${i + 1}`)}</div>
                <div class="pc-line"><span class="pc-k">${esc(mod.fnName)}(</span><span class="pc-v">${esc(t.args.map(pyRepr).join(", "))}</span><span class="pc-k">)</span></div>
                <div class="pc-line"><span class="pc-k">→</span> <span class="pc-v pc-exp">${esc(pyExpected(t))}</span></div>
              </div>`
              )
              .join("")}
            ${hidden ? `<div class="preview-case preview-hidden">${ICON.lock}${he(hidden === 1 ? "בדיקה נסתרת אחת" : `${hidden} בדיקות נסתרות`)}</div>` : ""}
          </div>`;
        setStdout("");
      },

      running(mode, waitingForRuntime) {
        testsEl.innerHTML = `
          <div class="console-running" dir="rtl">
            <div class="spinner"></div>
            <div>
              <div class="cr-title">${waitingForRuntime ? "מפעיל את סביבת Python…" : mode === "submit" ? "בודק את ההגשה…" : "מריץ את הבדיקות הגלויות…"}</div>
              <div class="cr-sub">${waitingForRuntime ? "בטעינה הראשונה מורידים את Pyodide (כ-10 MB). ההרצות הבאות מיידיות." : "רץ במפרש WebAssembly מבודד, ישירות בדפדפן"}</div>
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
                 <div><span class="vs-k">${he("עברו")}</span><span class="vs-v">${v.passed}/${v.total}</span></div>
                 <div><span class="vs-k">${he("זמן ריצה")}</span><span class="vs-v">${v.ms < 1 ? "<1" : v.ms.toFixed(1)} ms</span></div>
               </div>`
            : "";
        const bar =
          v.total !== undefined
            ? `<div class="verdict-bar">${r.results.map((x) => `<i class="${x.passed ? "ok" : "bad"}"></i>`).join("")}</div>`
            : "";

        let html = `
          <div class="verdict verdict-${v.kind}">
            <div class="verdict-main" dir="rtl">
              <div class="verdict-title">${v.kind === "ok" ? ICON.pass : ICON.fail}<span>${esc(v.title)}</span></div>
              <div class="verdict-sub">${v.sub}</div>
            </div>
            ${stats}
          </div>${bar}`;

        if (r && r.error) {
          html += `<pre class="trace trace-lg" dir="ltr">${esc(r.error)}</pre>`;
        } else if (r) {
          const firstFail = r.results.findIndex((x) => !x.passed);
          html += `<div class="cases">${r.results.map((x, i) => caseRow(x, i === firstFail)).join("")}</div>`;
        }
        testsEl.innerHTML = html;
        setStdout(r ? r.stdout : "");
        return v;
      },
    };
  }

  CBB.Console = { create };
})();
