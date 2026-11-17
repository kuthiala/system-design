// ══════════════════════════════════════════════════════════════
// DRILL — spaced repetition (Leitner boxes) over quiz cards.
// Cards come from finished lessons, the numbers drill, and practice
// problems. State lives in SD.store.drill.
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const DAY = 86400000;
  const INTERVALS = [0, 1, 3, 7, 14, 30]; // days per box

  function cards({ all = false } = {}) {
    const out = [];
    const done = SD.store.progress.all();
    SD.nodes.forEach(n => (n.quiz || []).forEach((q, i) => {
      if (all || done[n.id]) out.push({ id: `node:${n.id}:${i}`, q: q.q, a: q.a, src: n.name, link: `#/lesson/${n.id}` });
    }));
    (SD.reference.numbers?.drill || []).forEach((q, i) =>
      out.push({ id: `num:${i}`, q: q.q, a: q.a, src: "Numbers", link: "#/reference/numbers" }));
    SD.practice.forEach(p => (p.quiz || []).forEach((q, i) => {
      if (all || done["practice:" + p.id]) out.push({ id: `prac:${p.id}:${i}`, q: q.q, a: q.a, src: p.title, link: `#/practice/${p.id}` });
    }));
    return out;
  }

  function isDue(card, now = Date.now()) {
    const st = SD.store.drill.get(card.id);
    return !st || st.due <= now;
  }

  function due() { const now = Date.now(); return cards().filter(c => isDue(c, now)); }

  function rate(id, how) {
    const st = SD.store.drill.get(id) || { box: 0, due: 0, seen: 0, lapses: 0 };
    st.seen++;
    if (how === "again") { st.box = 0; st.lapses++; }
    else if (how === "easy") st.box = Math.min(INTERVALS.length - 1, st.box + 2);
    else st.box = Math.min(INTERVALS.length - 1, st.box + 1);
    st.due = Date.now() + (how === "again" ? 60000 : INTERVALS[st.box] * DAY);
    SD.store.drill.set(id, st);
    window.dispatchEvent(new CustomEvent("sd:drill"));
  }

  function stats() {
    const all = cards(), now = Date.now();
    const boxes = [0, 0, 0, 0, 0, 0];
    let seen = 0;
    all.forEach(c => { const st = SD.store.drill.get(c.id); if (st) { seen++; boxes[st.box]++; } });
    return { total: all.length, due: all.filter(c => isDue(c, now)).length, seen, boxes };
  }

  SD.drill = { cards, due, rate, stats, INTERVALS };
})();
