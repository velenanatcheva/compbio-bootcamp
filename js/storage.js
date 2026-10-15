/* ==========================================================================
   Storage — persists code, progress and UI preferences in localStorage.
   Every access is guarded: private windows / blocked storage just mean
   nothing persists, the app keeps working.
   ========================================================================== */
(function () {
  const CBB = (window.CBB = window.CBB || {});
  const KEY = "cbb.v1";

  const blank = () => ({
    code: {},        // moduleId -> source
    solved: {},      // moduleId -> ISO timestamp of first accepted submission
    attempts: {},    // moduleId -> number of submissions
    last: null,      // last opened moduleId
    ui: {},          // pane sizes, active tabs...
  });

  let state = blank();

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = Object.assign(blank(), JSON.parse(raw));
    } catch (_) {
      state = blank();
    }
  }

  function write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (_) {
      return false;
    }
  }

  read();

  CBB.Store = {
    getCode: (id) => (Object.prototype.hasOwnProperty.call(state.code, id) ? state.code[id] : null),
    saveCode(id, src) {
      state.code[id] = src;
      return write();
    },
    clearCode(id) {
      delete state.code[id];
      write();
    },

    isSolved: (id) => Boolean(state.solved[id]),
    markSolved(id) {
      const first = !state.solved[id];
      if (first) state.solved[id] = new Date().toISOString();
      write();
      return first;
    },
    solvedCount: () => Object.keys(state.solved).length,

    bumpAttempts(id) {
      state.attempts[id] = (state.attempts[id] || 0) + 1;
      write();
      return state.attempts[id];
    },
    attempts: (id) => state.attempts[id] || 0,

    getLast: () => state.last,
    setLast(id) {
      state.last = id;
      write();
    },

    getUI: (key, fallback) => (key in state.ui ? state.ui[key] : fallback),
    setUI(key, value) {
      state.ui[key] = value;
      write();
    },

    resetAll() {
      state = blank();
      try { localStorage.removeItem(KEY); } catch (_) {}
    },
  };
})();
