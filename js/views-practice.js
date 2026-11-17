// ══════════════════════════════════════════════════════════════
// VIEWS · PRACTICE — problem list and a single worked problem with
// progressive reveal (try it first, then open each step).
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const { esc, inline, prose } = SD.fmt;
  const { ul, h2 } = SD.views._h;

  function practiceList(el) {
    const done = SD.store.progress.all();
    const groups = ["warm-up", "core", "staff"].map(d => {
      const ps = SD.practice.filter(p => p.difficulty === d);
      if (!ps.length) return "";
      return h2(d[0].toUpperCase() + d.slice(1), `<div class="cards">${ps.map(p =>
        `<a class="card prac-card" href="#/practice/${esc(p.id)}"><div class="card-t">${done["practice:" + p.id] ? "✓ " : ""}${inline(p.title)}</div><div class="card-d">${inline(p.prompt)}</div><div class="card-n">${inline(p.time || "")}</div></a>`).join("")}</div>`);
    }).join("");
    el.innerHTML = `<div class="page"><header class="ls-head"><h1>Practice problems</h1><p class="ls-short">Attempt each out loud, timed, before revealing the worked answer.</p></header>${groups}</div>`;
    el.scrollTop = 0;
  }

  function practice(el, id) {
    const p = SD.practice.find(x => x.id === id);
    if (!p) return practiceList(el);
    const key = "practice:" + p.id, done = SD.store.progress.isDone(key);
    const reveal = (t, body) => body ? `<details class="reveal"><summary>${t}</summary><div>${body}</div></details>` : "";
    el.innerHTML = `<div class="page">
      <div class="ls-crumbs"><a class="crumb" href="#/practice">Practice</a></div>
      <header class="ls-head"><div class="ls-kicker"><span class="phase-chip">${inline(p.difficulty)}</span><span class="ls-time">${inline(p.time || "")}</span></div>
        <h1>${inline(p.title)}</h1></header>
      <div class="ls-tldr"><div class="ls-tldr-lbl">The prompt</div><p>${inline(p.prompt)}</p></div>
      ${p.whyAsked ? `<blockquote class="ls-insight"><div class="ls-insight-lbl">Why it is asked</div><p>${inline(p.whyAsked)}</p></blockquote>` : ""}
      <p class="ls-hint">Try it yourself first. Each step is hidden until you open it.</p>
      ${reveal("1 · Clarifying questions", (p.clarify || []).map(c => `<p><b>${inline(c.q)}</b><br>${inline(c.a)}</p>`).join(""))}
      ${reveal("2 · Requirements", p.requirements ? `<div class="mini-lbl">Functional</div>${ul(p.requirements.functional)}<div class="mini-lbl">Non-functional</div>${ul(p.requirements.nonFunctional)}` : "")}
      ${reveal("3 · Estimation", (p.estimation || []).map(e => `<p><b>${inline(e.label)}:</b> ${inline(e.work)}</p>`).join(""))}
      ${reveal("4 · API", ul(p.api))}
      ${reveal("5 · Data model", ul(p.dataModel))}
      ${reveal("6 · High-level design", prose(p.highLevel) + (p.diagram ? `<div class="prac-diagram" data-src="${esc(p.diagram)}"></div>` : ""))}
      ${reveal("7 · Deep dives", (p.deepDives || []).map(d => `<div class="pit"><div class="pit-t">${inline(d.title)}</div>${prose(d.body)}${d.tradeoff ? `<p class="ls-hint"><b>Tradeoff:</b> ${inline(d.tradeoff)}</p>` : ""}</div>`).join(""))}
      ${reveal("8 · Failure modes", ul(p.failureModes))}
      ${reveal("9 · Staff signals", ul(p.staffSignals))}
      ${p.phases?.length ? h2("Lessons this exercises", `<div class="related">${p.phases.map(pid => SD.byId[pid] ? `<a class="rel-link" href="#/lesson/${esc(pid)}">${inline(SD.byId[pid].name)}</a>` : "").join("")}</div>`) : ""}
      ${p.quiz?.length ? h2("Check yourself", p.quiz.map((q, i) => `<details class="qz"><summary><span class="qz-n">${i + 1}</span><span class="qz-q">${inline(q.q)}</span></summary><div class="qz-a">${prose(q.a)}</div></details>`).join("")) : ""}
      <footer class="ls-nav"><button type="button" class="btn-done ${done ? "on" : ""}" data-pdone>${done ? "✓ Done" : "Mark as done"}</button></footer>
    </div>`;
    const btn = el.querySelector("[data-pdone]");
    btn.onclick = () => { const now = !SD.store.progress.isDone(key); SD.store.progress.setDone(key, now); btn.classList.toggle("on", now); btn.textContent = now ? "✓ Done" : "Mark as done"; };
    el.querySelectorAll(".prac-diagram").forEach(d => {
      d.closest("details").addEventListener("toggle", async () => {
        if (d.dataset.done) return; d.dataset.done = "1";
        try { await SD.mermaidRender(d, d.dataset.src); } catch (_) { d.innerHTML = `<pre>${esc(d.dataset.src)}</pre>`; }
      });
    });
    el.scrollTop = 0;
  }

  Object.assign(SD.views, { practice, practiceList });
})();
