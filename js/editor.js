/* ==========================================================================
   Editor — thin wrapper over CodeMirror 5 with one Doc per module (so each
   module keeps its own undo history). Falls back to a hardened <textarea>
   (tab-indent, auto-indent, shortcuts) if the CDN could not be reached.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const INDENT = "    ";

  function createCodeMirror(host, opts) {
    const docs = new Map();
    const run = () => opts.onRun && opts.onRun();
    const submit = () => opts.onSubmit && opts.onSubmit();

    const cm = window.CodeMirror(host, {
      value: "",
      mode: "python",
      theme: "cbb",
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      smartIndent: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      lineWrapping: false,
      viewportMargin: Infinity,
      extraKeys: {
        Tab: (ed) => (ed.somethingSelected() ? ed.indentSelection("add") : ed.replaceSelection(INDENT, "end")),
        "Shift-Tab": (ed) => ed.indentSelection("subtract"),
        "Cmd-Enter": run,
        "Ctrl-Enter": run,
        "Shift-Cmd-Enter": submit,
        "Shift-Ctrl-Enter": submit,
        "Cmd-/": "toggleComment",
        "Ctrl-/": "toggleComment",
      },
    });

    let silent = false;
    cm.on("change", () => {
      if (!silent && opts.onChange) opts.onChange(cm.getValue());
    });

    return {
      kind: "codemirror",
      load(id, value) {
        if (!docs.has(id)) docs.set(id, window.CodeMirror.Doc(value, "python"));
        silent = true;
        cm.swapDoc(docs.get(id));
        silent = false;
        cm.refresh();
      },
      getValue: () => cm.getValue(),
      setValue(value) {
        // replaceRange keeps the reset undoable (Cmd-Z restores the old code)
        cm.replaceRange(value, { line: 0, ch: 0 }, { line: cm.lastLine() });
      },
      focus: () => cm.focus(),
      refresh: () => cm.refresh(),
    };
  }

  function createTextarea(host, opts) {
    const ta = document.createElement("textarea");
    ta.className = "editor-fallback";
    ta.spellcheck = false;
    ta.setAttribute("autocapitalize", "off");
    ta.setAttribute("autocomplete", "off");
    host.appendChild(ta);
    const values = new Map();
    let currentId = null;

    const fire = () => {
      values.set(currentId, ta.value);
      opts.onChange && opts.onChange(ta.value);
    };
    const insert = (text) => {
      // execCommand keeps native undo; fall back to setRangeText
      if (!document.execCommand || !document.execCommand("insertText", false, text)) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
        fire();
      }
    };

    ta.addEventListener("input", fire);
    ta.addEventListener("keydown", (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Enter" && mod) {
        e.preventDefault();
        e.shiftKey ? opts.onSubmit && opts.onSubmit() : opts.onRun && opts.onRun();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          const start = ta.value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
          if (ta.value.slice(start, start + 4) === INDENT) {
            ta.setSelectionRange(start, start + 4);
            insert("");
          }
        } else insert(INDENT);
        return;
      }
      if (e.key === "Enter") {
        // Auto-indent: keep current indentation; add a level after ':'
        const before = ta.value.slice(0, ta.selectionStart);
        const line = before.slice(before.lastIndexOf("\n") + 1);
        let indent = line.match(/^\s*/)[0];
        if (/:\s*$/.test(line)) indent += INDENT;
        e.preventDefault();
        insert("\n" + indent);
      }
    });

    return {
      kind: "textarea",
      load(id, value) {
        if (currentId !== null) values.set(currentId, ta.value);
        currentId = id;
        ta.value = values.has(id) ? values.get(id) : value;
      },
      getValue: () => ta.value,
      setValue(value) {
        ta.value = value;
        fire();
      },
      focus: () => ta.focus(),
      refresh() {},
    };
  }

  CBB.Editor = {
    create(host, opts = {}) {
      return window.CodeMirror ? createCodeMirror(host, opts) : createTextarea(host, opts);
    },
    /** Static highlighting for lesson code blocks (no-op without CodeMirror). */
    highlight(root) {
      if (!window.CodeMirror || !window.CodeMirror.runMode) return;
      root.querySelectorAll('pre.code[data-lang="python"]').forEach((pre) => {
        if (pre.dataset.hl) return;
        const src = pre.textContent;
        pre.textContent = "";
        pre.classList.add("cm-s-cbb");
        window.CodeMirror.runMode(src, "python", pre);
        pre.dataset.hl = "1";
      });
    },
  };
})();
