// ══════════════════════════════════════════════════════════════
// VIEWS · REFERENCE + DRILL — numbers, interview playbook,
// building blocks, and the spaced-repetition drill session.
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const { esc, inline, prose } = SD.fmt;
  const { ul, h2 } = SD.views._h;
  const row = (l, v) => v ? `<div class="ap-row"><div class="ap-lbl">${l}</div><div class="ap-val">${inline(v)}</div></div>` : "";

  function numbers(r) {
    return (r.sections || []).map(s => h2(inline(s.title), (s.intro ? `<p>${inline(s.intro)}</p>` : "") +
      `<table class="ref-table">${s.rows.map(x => `<tr><td>${inline(x.item)}</td><td class="num">${inline(x.value)}</td><td class="note">${inline(x.note || "")}</td></tr>`).join("")}</table>`)).join("")
      + h2("Estimation recipes", (r.recipes || []).map(x => `<div class="pit"><div class="pit-t">${inline(x.name)}</div><ol class="prose-list">${x.steps.map(s => `<li>${inline(s)}</li>`).join("")}</ol><p class="ls-hint">${inline(x.example || "")}</p></div>`).join(""))
      + (r.drill?.length ? `<p class="ls-hint">${r.drill.length} estimation cards from this page are in the <a href="#/drill">Drill</a>.</p>` : "");
  }

  function playbook(r) {
    return h2("Timeline", (r.timeline || []).map(t => `<div class="pb-step"><div class="pb-min">${inline(t.minutes)} min</div><div><h3>${inline(t.phase)}</h3><p>${inline(t.goal)}</p>
        <div class="mini-lbl">Do</div>${ul(t.do)}<div class="mini-lbl">Avoid</div>${ul(t.avoid)}${t.say ? `<p class="pb-say">${inline(t.say)}</p>` : ""}</div></div>`).join(""))
      + (r.signals ? h2("Signals", `<div class="iv-cols"><div class="iv-col senior"><div class="iv-col-lbl">Senior</div>${ul(r.signals.senior)}</div><div class="iv-col staff"><div class="iv-col-lbl">Staff</div>${ul(r.signals.staff)}</div></div>`) : "")
      + h2("Useful phrases", ul(r.phrases)) + h2("Red flags", ul(r.redFlags))
      + (r.questionBank || []).map(q => h2(inline(q.category), ul(q.items))).join("");
  }

  function blocks(r) {
    return (r.groups || []).map(g => h2(inline(g.name), g.blocks.map(b => `<div class="blk" id="blk-${esc(b.id)}"><h3>${inline(b.name)}</h3>
      ${row("What", b.what)}${row("How", b.how)}${row("Reach for it", b.reachFor)}${row("Gotcha", b.gotcha)}
      ${b.related?.length ? `<div class="related">${b.related.map(id => SD.byId[id] ? `<a class="rel-link" href="#/lesson/${esc(id)}">${inline(SD.byId[id].name)}</a>` : "").join("")}</div>` : ""}</div>`).join(""))).join("");
  }

  const TABS = [["numbers", "Numbers", numbers], ["playbook", "Interview playbook", playbook], ["blocks", "Building blocks", blocks]];

  function reference(el, which) {
    const R = SD.reference;
    if (!R[which]) which = "numbers";
    const nav = `<div class="tabs">${TABS.filter(([k]) => R[k]).map(([k, t]) => `<a class="tab ${k === which ? "on" : ""}" href="#/reference/${k}">${t}</a>`).join("")}</div>`;
    const r = R[which], fn = TABS.find(t => t[0] === which)[2];
    el.innerHTML = `<div class="page">${nav}<header class="ls-head"><h1>${inline(r.title)}</h1></header>${prose(r.intro)}${fn(r)}</div>`;
    el.scrollTop = 0;
  }

  function drill(el) {
    const queue = SD.drill.due();
    let i = 0;
    function show() {
      const st = SD.drill.stats(), c = queue[i];
      const card = c ? `<div class="drill-card">
          <div class="drill-src"><a href="${esc(c.link)}">${inline(c.src)}</a> · ${i + 1} of ${queue.length}</div>
          <div class="drill-q">${inline(c.q)}</div>
          <button type="button" class="btn-done" data-reveal>Show answer</button>
          <div class="drill-a" hidden>${prose(c.a)}
            <div class="qz-rate"><span>Did you have it?</span>
              <button type="button" class="btn-rate again" data-rate="again">Not yet</button>
              <button type="button" class="btn-rate good" data-rate="good">Mostly</button>
              <button type="button" class="btn-rate easy" data-rate="easy">Cold</button></div></div></div>`
        : `<div class="drill-card"><div class="drill-q">Nothing due right now. Finish more lessons to add their cards, or come back later.</div></div>`;
      el.innerHTML = `<div class="page"><header class="ls-head"><h1>Drill</h1>
        <p class="ls-short">${st.total} cards · ${st.due} due · ${st.seen} seen</p></header>${card}</div>`;
      el.querySelector("[data-reveal]")?.addEventListener("click", e => { e.target.hidden = true; el.querySelector(".drill-a").hidden = false; });
      el.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => { SD.drill.rate(c.id, b.dataset.rate); i++; show(); });
    }
    show();
  }

  Object.assign(SD.views, { reference, drill });
})();
