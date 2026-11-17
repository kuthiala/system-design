// ══════════════════════════════════════════════════════════════
// VIEWS — full-page views other than the Map. Split across files:
//   views.js           helpers + learn (curriculum) + lesson
//   views-practice.js  practice list + problem
//   views-reference.js numbers, playbook, blocks + drill
// Each view is render(el, arg) and writes HTML into the container.
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const { esc, inline, prose } = SD.fmt;
  const ul = items => items?.length ? `<ul>${items.map(i => `<li>${inline(i)}</li>`).join("")}</ul>` : "";
  const h2 = (t, body) => body ? `<section class="ls"><h2>${t}</h2>${body}</section>` : "";

  // ── "Where am I" rail shared by the curriculum and lesson pages ──
  function rail(current) {
    const c = SD.curriculum, done = SD.store.progress.all();
    const phase = current ? SD.phaseOf(current) : null;
    const arcIdx = phase ? c.arcs.findIndex(a => a.phases.includes(phase.id)) : -1;
    let here = "";
    if (current && phase) {
      const sibs = current === phase ? [] : (phase.children || []);
      const pos = sibs.indexOf(current);
      here = `<div class="rail-here"><div class="rail-here-lbl">You are here</div>
        ${arcIdx >= 0 ? `<div class="rail-here-arc">Arc ${arcIdx + 1} · ${inline(c.arcs[arcIdx].title)}</div>` : ""}
        <div class="rail-here-path">${inline(phase.name.replace(/^Phase \d+ · /, ""))}${current !== phase ? ` › ${inline(current.name)}` : ""}</div>
        ${pos >= 0 ? `<div class="rail-here-pos">Lesson ${pos + 1} of ${sibs.length}</div>` : ""}</div>`;
    }
    const arcs = c.arcs.map((arc, i) => {
      const lessons = SD.lessonsInArc(arc), n = lessons.filter(l => done[l.id]).length;
      const isCur = i === arcIdx;
      const phases = isCur ? arc.phases.map(pid => {
        const p = SD.byId[pid]; if (!p) return "";
        const curP = p === phase;
        const kids = curP ? `<div class="rail-lessons">${(p.children || []).map(k =>
          `<a href="#/lesson/${esc(k.id)}" class="${done[k.id] ? "done" : ""} ${k === current ? "here" : ""}">${inline(k.name)}</a>`).join("")}</div>` : "";
        return `<div class="rail-phase ${curP ? "cur" : ""}" style="--c:${SD.colorOf(p)}"><a href="#/lesson/${esc(p.id)}" class="${done[p.id] ? "done" : ""} ${p === current ? "here" : ""}">${p.icon || ""} ${inline(p.name.replace(/^Phase \d+ · /, ""))}</a>${kids}</div>`;
      }).join("") : "";
      const first = arc.phases[0];
      return `<div class="rail-arc ${isCur ? "cur" : ""}"><a href="#/lesson/${esc(first)}"><span>${i + 1}. ${inline(arc.title)}</span><small>${n}/${lessons.length}</small></a>${phases}</div>`;
    }).join("");
    return `<aside class="rail"><a class="rail-home ${current ? "" : "on"}" href="#/learn">📚 Curriculum overview</a>${here}
      <div class="rail-sec-lbl">Outline</div>${arcs}<div class="rail-sec" hidden><div class="rail-sec-lbl">On this page</div><div class="rail-toc"></div></div></aside>`;
  }

  function learn(el) {
    const c = SD.curriculum, done = SD.store.progress.all();
    const arcs = c.arcs.map((arc, i) => {
      const lessons = SD.lessonsInArc(arc);
      const n = lessons.filter(l => done[l.id]).length;
      const pct = lessons.length ? Math.round(100 * n / lessons.length) : 0;
      const phases = arc.phases.map(pid => {
        const p = SD.byId[pid]; if (!p) return "";
        const kids = (p.children || []).map(k => `<a class="cur-lesson ${done[k.id] ? "done" : ""}" href="#/lesson/${esc(k.id)}">${k.icon || ""} ${inline(k.name)}</a>`).join("");
        return `<div class="cur-phase"><a class="cur-phase-name ${done[p.id] ? "done" : ""}" href="#/lesson/${esc(p.id)}" style="--c:${SD.colorOf(p)}">${p.icon || ""} ${inline(p.name)}</a><div class="cur-lessons">${kids}</div></div>`;
      }).join("");
      return `<div class="arc">
        <div class="arc-hdr"><span class="arc-n">Arc ${i + 1}</span><h2>${inline(arc.title)}</h2><span class="arc-theme">${inline(arc.theme || "")}</span></div>
        <div class="arc-progress"><div style="width:${pct}%"></div></div><div class="arc-count">${n} / ${lessons.length} lessons</div>
        ${prose(arc.narrative)}
        ${arc.staffLens ? `<blockquote class="ls-insight"><div class="ls-insight-lbl">Staff lens</div><p>${inline(arc.staffLens)}</p></blockquote>` : ""}
        ${phases}</div>`;
    }).join("");
    const plan = c.studyPlan ? h2(inline(c.studyPlan.title || "Study plan"),
      `<div class="plan">${c.studyPlan.weeks.map(w => `<div class="plan-wk"><b>Week ${w.week}</b> <span>${inline(w.focus)}</span><p>${inline(w.do)}</p></div>`).join("")}</div>`) : "";
    const last = SD.store.prefs.get("lastLesson", "");
    el.innerHTML = `<div class="learn-wrap">${rail(null)}<div class="page">
      <header class="ls-head"><h1>${inline(c.title)}</h1><p class="ls-short">${inline(c.subtitle || "")}</p></header>
      ${last && SD.byId[last] ? `<p><a class="btn-done" href="#/lesson/${esc(last)}">Continue: ${inline(SD.byId[last].name)} →</a></p>` : ""}
      ${prose(c.intro)}
      ${h2("How to study", `<ol class="prose-list">${(c.howToStudy || []).map(s => `<li>${inline(s)}</li>`).join("")}</ol>`)}
      ${arcs}${plan}</div></div>`;
    el.scrollTop = 0;
  }

  function lesson(el, id) {
    const node = SD.byId[id];
    if (!node) { el.innerHTML = `<div class="page"><h1>Not found</h1><p><a href="#/learn">Back to curriculum</a></p></div>`; return; }
    SD.store.prefs.set("lastLesson", id);
    el.innerHTML = `<div class="learn-wrap">${rail(node)}<div class="page lesson-page">${SD.lesson.render(node)}
      <p class="ls-hint"><a href="#/map/${esc(id)}">View on the map →</a></p></div></div>`;
    SD.lesson.wire(el, node);
    const toc = SD.lesson.toc(el);
    const sec = el.querySelector(".rail-sec"), box = el.querySelector(".rail-toc");
    if (toc.length) {
      sec.hidden = false;
      box.innerHTML = toc.map(t => `<a data-sec="${esc(t.id)}">${esc(t.title)}</a>`).join("");
      box.querySelectorAll("a").forEach(a => a.onclick = () => toc.find(t => t.id === a.dataset.sec)?.el.scrollIntoView({ behavior: "smooth" }));
      // Highlight the section being read
      el.onscroll = () => {
        let cur = toc[0];
        toc.forEach(t => { if (t.el.getBoundingClientRect().top < 140) cur = t; });
        box.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.dataset.sec === cur.id));
      };
    } else el.onscroll = null;
    el.scrollTop = 0;
    const railEl = el.querySelector(".rail"), hereEl = el.querySelector(".rail a.here");
    if (railEl && hereEl) railEl.scrollTop = hereEl.offsetTop - railEl.clientHeight / 2;
  }

  SD.views = Object.assign(SD.views || {}, { learn, lesson, _h: { ul, h2 } });
})();
