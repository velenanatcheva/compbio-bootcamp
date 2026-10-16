/* ==========================================================================
   Pyodide Web Worker
   Runs Python off the main thread so the UI never freezes, and so a runaway
   `while True:` can be killed by terminating the worker (see runner.js).
   ========================================================================== */
/* global loadPyodide, importScripts */
const PYODIDE_VERSION = "0.26.4";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

importScripts(INDEX_URL + "pyodide.js");

/* The test harness. User code is compiled as "solution.py" so tracebacks only
   show the learner's own frames, with their source lines. */
const HARNESS = String.raw`
import sys, io, json, math, time, copy, traceback, linecache

_MAX_STDOUT = 20000

def _cbb_fmt(exc, filename="solution.py"):
    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == filename]
    parts = []
    if frames:
        parts.append("Traceback (most recent call last):\n")
        parts.extend(traceback.format_list(frames))
    parts.extend(traceback.format_exception_only(type(exc), exc))
    return "".join(parts).rstrip()

def _cbb_repr(value, limit=300):
    r = repr(value)
    return r if len(r) <= limit else r[:limit] + f"... ({len(r)} chars)"

def _cbb_equal(actual, expected, tol):
    if tol is not None:
        if isinstance(actual, bool) or not isinstance(actual, (int, float)):
            return False
        return math.isclose(actual, expected, rel_tol=1e-9, abs_tol=tol)
    if isinstance(expected, dict):
        # Any mapping with the same items counts (dict, Counter, defaultdict...)
        if not isinstance(actual, dict):
            return False
        return dict(actual) == expected
    if isinstance(expected, list):
        if isinstance(actual, (str, bytes)) or not hasattr(actual, "__iter__"):
            return False
        try:
            return list(actual) == expected
        except Exception:
            return False
    return type(actual) is type(expected) and actual == expected

def _cbb_exec(code, fn_name, tests, out, buf):
    ns = {"__name__": "__main__"}
    try:
        exec(compile(code, "solution.py", "exec"), ns)
    except BaseException as e:
        out["error"] = _cbb_fmt(e)
        out["errorKind"] = "Compile Error" if isinstance(e, SyntaxError) else "Runtime Error"
        return
    fn = ns.get(fn_name)
    if not callable(fn):
        out["error"] = f"NameError: name '{fn_name}' is not defined"
        out["errorKind"] = "Missing Function"
        return
    for i, t in enumerate(tests):
        args = t["args"]
        tol = t.get("tol")
        r = {
            "index": i,
            "hidden": bool(t.get("hidden")),
            "input": ", ".join(_cbb_repr(a, 120) for a in args),
        }
        if "raises" in t:
            r["expected"] = f"raises {t['raises']}"
        else:
            exp = float(t["expected"]) if tol is not None else t["expected"]
            r["expected"] = _cbb_repr(exp)
        mark = len(buf.getvalue())
        t0 = time.perf_counter()
        try:
            actual = fn(*copy.deepcopy(args))
            r["ms"] = (time.perf_counter() - t0) * 1000
            r["output"] = _cbb_repr(actual)
            if "raises" in t:
                r["passed"] = False
                r["note"] = {"code": "no-raise", "exc": t["raises"]}
            else:
                r["passed"] = _cbb_equal(actual, t["expected"], tol)
                if not r["passed"] and tol is None and actual == t["expected"]:
                    r["note"] = {"code": "wrong-type", "got": type(actual).__name__, "want": type(t["expected"]).__name__}
                elif not r["passed"] and actual is None:
                    r["note"] = {"code": "returned-none"}
        except BaseException as e:
            r["ms"] = (time.perf_counter() - t0) * 1000
            names = [c.__name__ for c in type(e).__mro__]
            if "raises" in t and t["raises"] in names:
                r["passed"] = True
                r["output"] = f"raised {type(e).__name__}"
            else:
                r["passed"] = False
                r["output"] = f"raised {type(e).__name__}"
                r["error"] = _cbb_fmt(e)
        r["stdout"] = buf.getvalue()[mark:][:_MAX_STDOUT]
        out["results"].append(r)

def __cbb_run(code, fn_name, tests_json):
    tests = json.loads(tests_json)
    out = {"error": None, "errorKind": None, "results": [], "stdout": ""}
    linecache.cache["solution.py"] = (len(code), None, code.splitlines(True), "solution.py")
    buf = io.StringIO()
    saved = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buf
    try:
        _cbb_exec(code, fn_name, tests, out, buf)
    finally:
        sys.stdout, sys.stderr = saved
    s = buf.getvalue()
    out["stdout"] = s if len(s) <= _MAX_STDOUT else s[:_MAX_STDOUT] + "\n... (output truncated)"
    return json.dumps(out)

def __cbb_snippet(code):
    """Run a lesson code example as a script; capture stdout and any error."""
    out = {"stdout": "", "error": None}
    linecache.cache["example.py"] = (len(code), None, code.splitlines(True), "example.py")
    buf = io.StringIO()
    saved = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buf
    try:
        exec(compile(code, "example.py", "exec"), {"__name__": "__main__"})
    except BaseException as e:
        out["error"] = _cbb_fmt(e, "example.py")
    finally:
        sys.stdout, sys.stderr = saved
    s = buf.getvalue()
    out["stdout"] = s if len(s) <= _MAX_STDOUT else s[:_MAX_STDOUT] + "\n... (output truncated)"
    return json.dumps(out)
`;

let pyodide = null;

const ready = (async () => {
  try {
    pyodide = await loadPyodide({ indexURL: INDEX_URL });
    pyodide.runPython(HARNESS);
    const version = pyodide.runPython("import sys; sys.version.split()[0]");
    postMessage({ type: "ready", version });
  } catch (err) {
    postMessage({ type: "init-error", error: String(err && err.message ? err.message : err) });
    throw err;
  }
})();

onmessage = async (event) => {
  const { id, kind, code, fnName, tests } = event.data;
  try {
    await ready;
    let json;
    if (kind === "snippet") {
      const snippet = pyodide.globals.get("__cbb_snippet");
      json = snippet(code);
      snippet.destroy();
    } else {
      const run = pyodide.globals.get("__cbb_run");
      json = run(code, fnName, JSON.stringify(tests));
      run.destroy();
    }
    postMessage({ type: "result", id, result: JSON.parse(json) });
  } catch (err) {
    postMessage({ type: "result", id, internalError: String(err && err.message ? err.message : err) });
  }
};
