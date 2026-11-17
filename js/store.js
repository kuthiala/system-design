// ══════════════════════════════════════════════════════════════
// STORE — localStorage persistence for progress, drill state, prefs
// Everything is wrapped in try/catch: private windows and blocked
// storage must never break the app.
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const NS = "sd2.";

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  }
  function set(key, value) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch (_) {}
  }
  function remove(key) {
    try { localStorage.removeItem(NS + key); } catch (_) {}
  }
  function clearAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(NS) || k.startsWith("sd_"))
        .forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  }

  // ── Lesson progress ──
  const progress = {
    all()       { return get("progress", {}); },
    isDone(id)  { return !!this.all()[id]; },
    setDone(id, done) {
      const p = this.all();
      if (done) p[id] = Date.now(); else delete p[id];
      set("progress", p);
      window.dispatchEvent(new CustomEvent("sd:progress"));
    },
    count()     { return Object.keys(this.all()).length; },
  };

  // ── Spaced repetition state, keyed by card id ──
  // state = { box: 0..5, due: epoch ms, seen: n, lapses: n }
  const drill = {
    all()        { return get("drill", {}); },
    get(id)      { return this.all()[id] || null; },
    set(id, st)  { const d = this.all(); d[id] = st; set("drill", d); },
    reset()      { remove("drill"); },
  };

  // ── Last-visited and misc prefs ──
  const prefs = {
    get(k, fb)   { return get("prefs." + k, fb); },
    set(k, v)    { set("prefs." + k, v); },
  };

  SD.store = { get, set, remove, clearAll, progress, drill, prefs };
})();
