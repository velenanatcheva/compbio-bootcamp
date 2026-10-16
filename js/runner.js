/* ==========================================================================
   Runner — owns the Pyodide worker, enforces a time limit, and broadcasts
   runtime status ("loading" | "ready" | "running" | "error") to the UI.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});

  const TIME_LIMIT_MS = 8000;

  let worker = null;
  let readyPromise = null;
  let version = null;
  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  let status = { state: "loading", detail: "" };

  function emit(state, detail = "") {
    status = { state, detail };
    listeners.forEach((fn) => fn(status));
  }

  function boot() {
    if (worker) worker.terminate();
    emit("loading", version ? "מפעיל מחדש את Python…" : "טוען Python…");

    readyPromise = new Promise((resolve, reject) => {
      try {
        worker = new Worker("js/pyworker.js");
      } catch (err) {
        const msg =
          location.protocol === "file:"
            ? "הדפדפן חוסם Web Workers בכתובת file://. הגישו את התיקייה דרך שרת HTTP (ראו README)."
            : String(err.message || err);
        emit("error", msg);
        reject(new Error(msg));
        return;
      }

      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === "ready") {
          version = m.version;
          emit("ready", `Python ${version}`);
          resolve();
        } else if (m.type === "init-error") {
          emit("error", m.error);
          reject(new Error(m.error));
        } else if (m.type === "result") {
          const job = pending.get(m.id);
          if (!job) return;
          pending.delete(m.id);
          clearTimeout(job.timer);
          emit("ready", `Python ${version}`);
          job.resolve(m);
        }
      };

      worker.onerror = (e) => {
        const msg = e.message || "סביבת Python לא הצליחה לעלות (בדקו את החיבור לאינטרנט).";
        emit("error", msg);
        reject(new Error(msg));
      };
    });
    readyPromise.catch(() => {}); // surfaced via status; avoid unhandled rejection noise
    return readyPromise;
  }

  /** Send one job to the worker with a time limit. */
  async function dispatch(payload) {
    try {
      await readyPromise;
    } catch (err) {
      return { internalError: err.message };
    }
    return new Promise((resolve) => {
      const id = ++seq;
      emit("running", "מריץ…");
      const timer = setTimeout(() => {
        pending.delete(id);
        boot(); // kill the stuck interpreter and start a fresh one
        resolve({ timeout: true, limit: TIME_LIMIT_MS });
      }, TIME_LIMIT_MS);
      pending.set(id, { resolve, timer });
      worker.postMessage({ id, ...payload });
    });
  }

  /**
   * Run `code`, call `fnName` against `tests`.
   * Resolves to { result } | { timeout: true } | { internalError }.
   */
  const run = (code, fnName, tests) => dispatch({ kind: "tests", code, fnName, tests });

  /** Run a lesson example as a plain script. result = { stdout, error }. */
  const exec = (code) => dispatch({ kind: "snippet", code });

  CBB.Runner = {
    boot,
    run,
    exec,
    retry: boot,
    get status() {
      return status;
    },
    get isReady() {
      return status.state === "ready";
    },
    onStatus(fn) {
      listeners.add(fn);
      fn(status);
      return () => listeners.delete(fn);
    },
    TIME_LIMIT_MS,
  };
})();
