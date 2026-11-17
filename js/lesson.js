// ══════════════════════════════════════════════════════════════
// LESSON — renders one node as a lesson. Used by the Learn view
// (full page) and by the Map's detail panel (compact).
//
// Section order is deliberate (see README "How a lesson is built"):
//   hook → one breath → key insight → mental model → what/why/numbers
//   → tradeoffs → scale ladder → specialised sections → war stories
//   → in the wild → applied example → interview lens → check yourself
//   → related / navigation
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const { esc, inline, prose } = SD.fmt;

  const SIZE_META = {
    small:  { label: "Small",  sub: "Startup",     cls: "s" },
    medium: { label: "Medium", sub: "Growth",      cls: "m" },
    large:  { label: "Large",  sub: "Scale-up",    cls: "l" },
    hyper:  { label: "Hyper",  sub: "Hyper-scale", cls: "h" },
  };
  const SIZES = ["small", "medium", "large", "hyper"];

  function section(id, title, body, extraCls = "") {
    if (!body) return "";
    return `<section class="ls ${extraCls}" data-sec="${id}"><h2>${title}</h2>${body}</section>`;
  }

  // ── Hook ──
  function buildHeader(node, opts) {
    const phase = SD.phaseOf(node);
    const arc = SD.arcOf(node);
    const siblings = phase ? [phase, ...(phase.children || [])] : [];
    const pos = siblings.indexOf(node);
    const color = SD.colorOf(node);
    const words = SD.fmt.wordCount(node);
    const crumbs = [];
    if (arc) crumbs.push(`<a href="#/learn" class="crumb">${inline(arc.title)}</a>`);
    if (phase && phase !== node) crumbs.push(`<a href="#/lesson/${phase.id}" class="crumb">${inline(phase.name.replace(/^Phase \d+ · /, ""))}</a>`);
    return `
      <header class="ls-head">
        <div class="ls-crumbs">${crumbs.join('<span class="crumb-sep">›</span>')}</div>
        <div class="ls-kicker">
          <span class="phase-chip" style="--c:${color}">${inline(node.phase || "")}</span>
          ${siblings.length > 1 && pos >= 0 ? `<span class="ls-pos">Lesson ${pos + 1} of ${siblings.length}</span>` : ""}
          <span class="ls-time">${SD.fmt.minutes(words)} min read</span>
        </div>
        <h1><span class="ls-icon">${node.icon || ""}</span>${inline(node.name)}</h1>
        <p class="ls-short">${inline(node.short || "")}</p>
      </header>`;
  }

  function buildTldr(node) {
    if (!node.tldr) return "";
    return `<div class="ls-tldr"><div class="ls-tldr-lbl">In one breath</div><p>${inline(node.tldr)}</p></div>`;
  }

  function buildKeyInsight(text) {
    if (!text) return "";
    return `<blockquote class="ls-insight"><div class="ls-insight-lbl">💡 Key insight</div><p>${inline(text)}</p></blockquote>`;
  }

  function buildMentalModel(text) {
    if (!text) return "";
    return `<div class="ls-model"><div class="ls-model-lbl">🧠 Mental model</div>${prose(text)}</div>`;
  }

  function buildPrimer(text) {
    if (!text) return "";
    return section("primer", "Primer", `<div class="ls-primer">${prose(text)}</div>`);
  }

  function buildDetail(node) {
    const d = node.detail || {};
    let html = "";
    if (d.what)    html += section("what", "What it is", prose(d.what));
    if (d.why)     html += section("why", "Why it matters", prose(d.why));
    if (d.numbers) html += section("numbers", "The numbers", `<div class="ls-numbers">${prose(d.numbers)}</div>`);
    return html;
  }

  // ── Tradeoffs (interactive sliders) ──
  function buildTradeoffs(tradeoffs) {
    if (!tradeoffs?.length) return "";
    const items = tradeoffs.map((t, i) => `
      <div class="ta" data-pos="${typeof t.pos === "number" ? t.pos : 0.5}">
        <div class="ta-name">${inline(t.axis)}</div>
        <div class="ta-labels"><div class="ta-l">${inline(t.left)}</div><div class="ta-r">${inline(t.right)}</div></div>
        <div class="ta-track-wrap" tabindex="0" role="slider" aria-label="${esc(t.axis)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <div class="ta-track"><div class="ta-mk" style="left:50%"></div></div>
        </div>
      </div>`).join("");
    return section("tradeoffs", "Tradeoffs", `<p class="ls-hint">Drag each marker. The side that brightens is what you are buying; the side that dims is what you are paying.</p>${items}`);
  }

  function paintTradeoff(ta, pos) {
    const mk = ta.querySelector(".ta-mk"), l = ta.querySelector(".ta-l"), r = ta.querySelector(".ta-r"), w = ta.querySelector(".ta-track-wrap");
    if (!mk) return;
    mk.style.left = (pos * 100) + "%";
    l.style.opacity = (0.4 + (1 - pos) * 0.6).toFixed(2);
    r.style.opacity = (0.4 + pos * 0.6).toFixed(2);
    w?.setAttribute("aria-valuenow", Math.round(pos * 100));
  }

  function wireTradeoffs(root) {
    root.querySelectorAll(".ta").forEach(ta => {
      const wrap = ta.querySelector(".ta-track-wrap");
      if (!wrap) return;
      paintTradeoff(ta, parseFloat(ta.dataset.pos || "0.5"));
      const setFrom = x => { const r = wrap.getBoundingClientRect(); paintTradeoff(ta, Math.min(1, Math.max(0, (x - r.left) / r.width))); };
      let drag = false;
      wrap.addEventListener("pointerdown", e => { drag = true; wrap.setPointerCapture?.(e.pointerId); setFrom(e.clientX); e.preventDefault(); });
      wrap.addEventListener("pointermove", e => { if (drag) setFrom(e.clientX); });
      const stop = e => { if (!drag) return; drag = false; try { wrap.releasePointerCapture?.(e.pointerId); } catch (_) {} };
      wrap.addEventListener("pointerup", stop); wrap.addEventListener("pointercancel", stop);
      wrap.addEventListener("keydown", e => {
        const cur = parseFloat(wrap.getAttribute("aria-valuenow") || "50") / 100;
        const map = { ArrowLeft: cur - 0.05, ArrowDown: cur - 0.05, ArrowRight: cur + 0.05, ArrowUp: cur + 0.05, Home: 0, End: 1 };
        if (e.key in map) { paintTradeoff(ta, Math.min(1, Math.max(0, map[e.key]))); e.preventDefault(); }
      });
    });
  }

  // ── Scale ladder: sizes_cfg + levelUp merged into one timeline ──
  function buildScaleLadder(node) {
    const cfg = node.sizes_cfg || {};
    const ups = node.levelUp || [];
    const present = SIZES.filter(s => cfg[s]);
    if (!present.length && !ups.length) return "";

    const upFrom = {};
    ups.forEach(u => { if (u.from) upFrom[u.from] = u; });

    let html = '<div class="ladder">';
    if (present.length) {
      present.forEach((s, i) => {
        const c = cfg[s], m = SIZE_META[s];
        html += `
          <div class="rung ${m.cls}">
            <div class="rung-dot"></div>
            <div class="rung-card">
              <div class="rung-lbl">${m.label} <span>${m.sub}</span></div>
              <div class="rung-range">${inline(c.range)}</div>
              <div class="rung-rec">${prose(c.rec)}</div>
              ${c.tools?.length ? `<div class="tools">${c.tools.map(t => `<span class="tool">${inline(t)}</span>`).join("")}</div>` : ""}
            </div>
          </div>`;
        const up = upFrom[s];
        if (up && i < present.length - 1) html += buildTrigger(up);
      });
      // Level-ups whose "from" isn't a listed size (rare) go at the end
      ups.filter(u => !present.includes(u.from)).forEach(u => { html += buildTrigger(u); });
    } else {
      ups.forEach(u => { html += buildTrigger(u); });
    }
    html += "</div>";
    const intro = present.length
      ? `<p class="ls-hint">Read top to bottom. Each rung is what you run at that scale; each ⚡ is the signal that it is time to climb, and what the climb looks like.</p>`
      : `<p class="ls-hint">The signals that tell you it is time to climb, and what the climb looks like.</p>`;
    return section("ladder", "The scale ladder", intro + html);
  }

  function buildTrigger(u) {
    const cls = u.from === "small" ? "s-m" : u.from === "medium" ? "m-l" : "l-h";
    const arrow = u.from === "small" ? "Small → Medium" : u.from === "medium" ? "Medium → Large" : "Large → Hyper";
    return `
      <div class="trigger ${cls}">
        <div class="trigger-line"></div>
        <div class="trigger-card">
          <div class="trigger-badge">⚡ ${arrow}</div>
          ${u.trigger ? `<div class="trigger-when"><span>When</span>${inline(u.trigger)}</div>` : ""}
          ${u.action ? `<div class="trigger-do"><span>Do</span>${prose(u.action)}</div>` : ""}
        </div>
      </div>`;
  }

  // ── Cards: pitfalls, examples, anti-patterns, principles, patterns ──
  function cards(items, cls, numbered) {
    return items.map((p, i) => `
      <div class="card ${cls}">
        ${numbered ? `<div class="card-n">${i + 1}</div>` : ""}
        <div class="card-body"><div class="card-t">${inline(p.name)}</div><div class="card-d">${prose(p.desc)}</div></div>
      </div>`).join("");
  }
  function buildPitfalls(items) { return items?.length ? section("pitfalls", "War stories: how this goes wrong", `<div class="cards">${cards(items, "pit", true)}</div>`) : ""; }
  function buildAntiPatterns(items) { return items?.length ? section("anti", "Anti-patterns", `<div class="cards">${cards(items, "ap", false)}</div>`) : ""; }
  function buildExamples(items) { return items?.length ? section("examples", "In the wild", `<div class="cards">${cards(items, "ex", false)}</div>`) : ""; }
  function buildPrinciples(items) { return items?.length ? section("principles", "Principles", `<div class="cards">${cards(items, "pr", true)}</div>`) : ""; }
  function buildKeyPatterns(items) { return items?.length ? section("patterns", "Key patterns", `<div class="cards">${cards(items, "kp", false)}</div>`) : ""; }
  function buildConsistencySpectrum(items) { return items?.length ? section("spectrum", "The consistency spectrum", `<div class="cards">${cards(items, "cs", true)}</div>`) : ""; }

  function buildHowItWorks(obj) {
    if (!obj || !Object.keys(obj).length) return "";
    const items = Object.entries(obj).map(([k, v]) => ({ name: k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), desc: v }));
    return section("how", "How it works", `<div class="cards">${cards(items, "hw", true)}</div>`);
  }

  function buildFormulas(list, title = "Formulas") {
    if (!list?.length) return "";
    return section("formulas", title, list.map(f => `
      <div class="formula"><div class="formula-n">${inline(f.name)}</div><code>${inline(f.expr)}</code>${f.note ? `<div class="formula-note">${inline(f.note)}</div>` : ""}</div>`).join(""));
  }

  function buildChecklist(items) {
    if (!items?.length) return "";
    return section("checklist", "Pre-flight checklist", `<ul class="checklist">${items.map(i => `<li><label><input type="checkbox"> <span>${inline(i)}</span></label></li>`).join("")}</ul>`);
  }

  function buildKeyMetrics(items) {
    if (!items?.length) return "";
    return section("metrics", "Key metrics", items.map(m => `
      <div class="km"><div class="km-name">${inline(m.name)}</div>
        <div class="km-target">🎯 Target: ${inline(m.target)}</div>
        ${m.alert_high ? `<div class="km-alert hi">🔴 High: ${inline(m.alert_high)}</div>` : ""}
        ${m.alert_low ? `<div class="km-alert lo">🔵 Low: ${inline(m.alert_low)}</div>` : ""}
        ${m.tools?.length ? `<div class="tools">${m.tools.map(t => `<span class="tool">${inline(t)}</span>`).join("")}</div>` : ""}
      </div>`).join(""));
  }

  function buildDecisionMatrix(items, title = "Decision matrix") {
    if (!items?.length) return "";
    return section("matrix", title, items.map(m => `
      <div class="dm"><div class="dm-scenario">${inline(m.scenario)}</div>
        ${m.answer ? `<div class="dm-answer">→ ${inline(m.answer)}</div>` : ""}
        ${m.recommendation ? `<div class="dm-answer">→ ${inline(m.recommendation)}</div>` : ""}
        ${m.reasoning ? `<div class="dm-reason">${inline(m.reasoning)}</div>` : ""}
      </div>`).join(""));
  }

  function buildDecisionFramework(df) {
    if (!df) return "";
    const factors = df.factors?.length ? `<div class="df-factors"><div class="mini-lbl">Key factors</div><ul>${df.factors.map(f => `<li>${inline(f)}</li>`).join("")}</ul></div>` : "";
    return section("framework", `Decision framework: ${inline(df.question)}`, factors) + buildDecisionMatrix(df.matrix, "Scenarios");
  }

  function buildTechnologyComparison(items) {
    if (!items?.length) return "";
    return section("techcmp", "Technology comparison", items.map(t => `
      <div class="tc"><div class="tc-name">${inline(t.name)} <span class="tc-type">${inline(t.type)}</span></div>
        <div class="tc-grid">
          <span class="tc-k">Throughput</span><span>${inline(t.throughput)}</span>
          <span class="tc-k">Latency</span><span>${inline(t.latency)}</span>
          <span class="tc-k">Durability</span><span>${inline(t.durability)}</span>
          <span class="tc-k">Ordering</span><span>${inline(t.ordering)}</span>
          <span class="tc-k">Replay</span><span>${inline(t.replay)}</span>
          <span class="tc-k">Multi-consumer</span><span>${inline(t.multiConsumer)}</span>
        </div>
        <div class="tc-best">Best for: ${inline(t.bestFor)}</div><div class="tc-weak">⚠ ${inline(t.weaknesses)}</div>
      </div>`).join(""));
  }

  function buildRoutingPatternComparison(items) {
    if (!items?.length) return "";
    return section("routing", "Routing pattern comparison", items.map(r => `
      <div class="tc"><div class="tc-name">${inline(r.name)}</div>
        <div class="tc-grid"><span class="tc-k">Pros</span><span>${inline(r.pros)}</span><span class="tc-k">Cons</span><span>${inline(r.cons)}</span><span class="tc-k">Best for</span><span>${inline(r.bestFor)}</span></div>
        ${r.tools?.length ? `<div class="tools">${r.tools.map(t => `<span class="tool">${inline(t)}</span>`).join("")}</div>` : ""}
      </div>`).join(""));
  }

  function buildStateTransitions(items) {
    if (!items?.length) return "";
    return section("states", "State transitions", items.map(t => `
      <div class="st"><div class="st-states"><span class="st-from">${inline(t.from)}</span> → <span class="st-to">${inline(t.to)}</span></div>
        <div class="st-cond">When: ${inline(t.condition)}</div><div class="st-impact">User impact: ${inline(t.userImpact)}</div></div>`).join(""));
  }

  function buildCommercialLandscape(cl) {
    if (!cl?.categories?.length) return "";
    return section("landscape", cl.title || "Commercial landscape", cl.categories.map(cat => `
      <div class="cl-cat"><div class="cl-cat-name">${inline(cat.name)}</div>${(cat.entries || []).map(e => `
        <div class="cl-entry"><div class="cl-name">${inline(e.name)}</div>
          <div class="cl-best">Best for: ${inline(e.bestFor)}</div><div class="cl-cost">💰 ${inline(e.cost)}</div>
          <div class="cl-str">✅ ${inline(e.strengths)}</div><div class="cl-weak">⚠ ${inline(e.weaknesses)}</div></div>`).join("")}</div>`).join(""));
  }

  function buildCostModel(cm) {
    if (!cm) return "";
    const parts = [];
    if (cm.description) parts.push(`<p class="ls-hint">${inline(cm.description)}</p>`);
    ["serverless", "containers_managed", "containers_self_managed", "spot"].filter(k => cm[k]).forEach(k => {
      const t = cm[k], label = k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      parts.push(`<div class="cm-tier"><div class="cm-tier-name">${label}</div><div class="cm-model">${inline(t.model)}</div><div class="cm-sweet">✅ ${inline(t.sweet_spot)}</div><div class="cm-trap">⚠ ${inline(t.trap)}</div><div class="cm-ex">e.g. ${inline(t.example)}</div></div>`);
    });
    (cm.examples || []).forEach(e => parts.push(`<div class="dm"><div class="dm-scenario">${inline(e.scenario)}</div><div class="dm-answer">Hosted: ${inline(e.hosted_cost)} · Self-hosted: ${inline(e.self_hosted_cost)}</div><div class="dm-reason">${inline(e.recommendation)}</div></div>`));
    return section("cost", "Cost model", parts.join(""));
  }

  function buildDefinedTerms(terms) {
    if (!terms || !Object.keys(terms).length) return "";
    return section("glossary", "Glossary", `<div class="dt-list">${Object.entries(terms).map(([k, v]) => `<div class="dt"><span class="dt-k">${inline(k)}</span><span class="dt-v">${inline(v)}</span></div>`).join("")}</div>`);
  }

  function buildMigrationPlaybook(pb) {
    if (!pb) return "";
    return section("playbook", "Migration playbook", Object.entries(pb).map(([key, val]) => `
      <div class="mp-section"><div class="mp-title">${key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</div>
        ${val.description ? `<p class="ls-hint">${inline(val.description)}</p>` : ""}
        ${(val.steps || []).map((s, i) => `<div class="mp-step"><span class="mp-n">${i + 1}</span><span>${inline(s)}</span></div>`).join("")}
      </div>`).join(""));
  }

  // ── Applied example overlay ──
  function buildExampleOverlay(node) {
    const ex = SD.examples?.active;
    if (!ex?.nodes) return "";
    const e = ex.nodes[node.id];
    const title = `${ex.icon || "📦"} Applied to: ${inline(ex.name)}`;
    if (!e) {
      return section("applied", title, `<p class="ls-hint">No specific guidance for this node in this example yet. Add it under <code>nodes["${esc(node.id)}"]</code> in <code>examples/${esc(ex.id)}.js</code>.</p>`, "ls-applied");
    }
    const row = (lbl, v, cls = "") => v ? `<div class="ap-row ${cls}"><div class="ap-lbl">${lbl}</div><div class="ap-val">${prose(v)}</div></div>` : "";
    return section("applied", title,
      row("Decision", e.decision, "ap-decision") +
      row("Why", e.why) + row("Context", e.context) + row("Tradeoffs", e.tradeoffs) +
      row("Risks and mitigations", e.risks) + row("Notes", e.notes),
      "ls-applied");
  }

  // ── Interview lens ──
  function buildInterview(iv) {
    if (!iv) return "";
    return section("interview", "Interview lens", `
      ${iv.prompt ? `<div class="iv-prompt"><div class="mini-lbl">The moment</div><p>${inline(iv.prompt)}</p></div>` : ""}
      <div class="iv-cols">
        ${iv.senior ? `<div class="iv-col senior"><div class="iv-col-lbl">A solid senior answer</div>${prose(iv.senior)}</div>` : ""}
        ${iv.staff ? `<div class="iv-col staff"><div class="iv-col-lbl">What staff adds</div>${prose(iv.staff)}</div>` : ""}
      </div>
      ${iv.probes?.length ? `<div class="iv-probes"><div class="mini-lbl">Follow-ups they will ask</div><ul>${iv.probes.map(p => `<li>${inline(p)}</li>`).join("")}</ul></div>` : ""}
    `, "ls-interview");
  }

  // ── Check yourself ──
  function buildQuiz(node) {
    const q = node.quiz || [];
    if (!q.length) return "";
    const items = q.map((it, i) => {
      const cid = `node:${node.id}:${i}`;
      return `
        <details class="qz" data-card="${esc(cid)}">
          <summary><span class="qz-n">${i + 1}</span><span class="qz-q">${inline(it.q)}</span></summary>
          <div class="qz-a">${prose(it.a)}</div>
          <div class="qz-rate"><span>Did you have it?</span>
            <button type="button" class="btn-rate again" data-rate="again">Not yet</button>
            <button type="button" class="btn-rate good" data-rate="good">Mostly</button>
            <button type="button" class="btn-rate easy" data-rate="easy">Cold</button>
          </div>
        </details>`;
    }).join("");
    return section("quiz", "Check yourself", `<p class="ls-hint">Answer out loud before you open each one. Your ratings schedule these cards in the Drill.</p>${items}`, "ls-quiz");
  }

  // ── Related + navigation + done ──
  function buildRelated(node) {
    if (!node.related?.length) return "";
    const links = node.related.map(r => {
      const t = SD.byId[r.id];
      return `<a class="rel-link" href="#/lesson/${esc(r.id)}" data-nav="${esc(r.id)}">${inline(r.label || t?.name || r.id)}</a>`;
    }).join("");
    return section("related", "Related lessons", `<div class="related">${links}</div>`);
  }

  function buildNav(node, opts) {
    if (opts.compact) return "";
    const prev = SD.prev(node.id), next = SD.next(node.id);
    const done = SD.store.progress.isDone(node.id);
    return `
      <footer class="ls-nav">
        <button type="button" class="btn-done ${done ? "on" : ""}" data-done="${esc(node.id)}">${done ? "✓ Done" : "Mark as done"}</button>
        <div class="ls-nav-links">
          ${prev ? `<a class="nav-link prev" href="#/lesson/${esc(prev.id)}" data-nav="${esc(prev.id)}"><span>← Previous</span><b>${inline(prev.name)}</b></a>` : "<span></span>"}
          ${next ? `<a class="nav-link next" href="#/lesson/${esc(next.id)}" data-nav="${esc(next.id)}"><span>Next →</span><b>${inline(next.name)}</b></a>` : `<a class="nav-link next" href="#/learn"><span>Finished the path</span><b>Back to curriculum</b></a>`}
        </div>
      </footer>`;
  }

  // ── Children list for phase nodes ──
  function buildChildren(node) {
    if (!node.children?.length) return "";
    const items = node.children.map((c, i) => `
      <a class="child-row" href="#/lesson/${esc(c.id)}" data-nav="${esc(c.id)}">
        <span class="child-n">${i + 1}</span><span class="child-icon">${c.icon || ""}</span>
        <span class="child-txt"><b>${inline(c.name)}</b><small>${inline(c.short || "")}</small></span>
        <span class="child-done">${SD.store.progress.isDone(c.id) ? "✓" : ""}</span>
      </a>`).join("");
    return section("children", "Lessons in this phase", `<div class="child-list">${items}</div>`);
  }

  // ── Compose ──
  function render(node, opts = {}) {
    let html = "";
    html += buildHeader(node, opts);
    html += buildTldr(node);
    html += buildKeyInsight(node.keyInsight);
    html += buildMentalModel(node.mentalModel);
    html += buildPrimer(node.primer);
    html += buildDetail(node);
    html += buildTradeoffs(node.tradeoffs);
    html += buildScaleLadder(node);
    html += buildFormulas(node.formulas, "Formulas");
    html += buildFormulas(node.coreFormulas, "Core formulas");
    html += buildHowItWorks(node.howItWorks);
    html += buildKeyPatterns(node.keyPatterns);
    html += buildConsistencySpectrum(node.consistencySpectrum);
    html += buildRoutingPatternComparison(node.routingPatternComparison);
    html += buildStateTransitions(node.stateTransitions);
    html += buildTechnologyComparison(node.technologyComparison);
    html += buildDecisionMatrix(node.decisionMatrix);
    html += buildDecisionFramework(node.decisionFramework);
    html += buildCommercialLandscape(node.commercialLandscape);
    html += buildCostModel(node.costModel);
    html += buildKeyMetrics(node.keyMetrics);
    html += buildPrinciples(node.principles);
    html += buildChecklist(node.checklist);
    html += buildMigrationPlaybook(node.migrationPlaybook);
    html += buildDefinedTerms(node.defined_terms);
    html += buildAntiPatterns(node.antiPatterns);
    html += buildPitfalls(node.pitfalls);
    html += buildExamples(node.examples);
    html += buildExampleOverlay(node);
    html += buildInterview(node.interview);
    html += buildQuiz(node);
    html += buildChildren(node);
    html += buildRelated(node);
    html += buildNav(node, opts);
    return `<article class="lesson ${opts.compact ? "compact" : ""}" data-node="${esc(node.id)}">${html}</article>`;
  }

  // Attach behaviour after the HTML is in the DOM.
  function wire(root, node, opts = {}) {
    wireTradeoffs(root);

    root.querySelectorAll("[data-nav]").forEach(a => {
      a.addEventListener("click", e => {
        if (opts.onNavigate) { e.preventDefault(); opts.onNavigate(a.dataset.nav); }
      });
    });

    root.querySelectorAll(".qz .btn-rate").forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        const det = btn.closest(".qz");
        const cid = det?.dataset.card;
        if (cid && SD.drill?.rate) SD.drill.rate(cid, btn.dataset.rate);
        det.querySelectorAll(".btn-rate").forEach(b => b.classList.remove("picked"));
        btn.classList.add("picked");
      });
    });

    const doneBtn = root.querySelector("[data-done]");
    if (doneBtn) {
      doneBtn.addEventListener("click", () => {
        const now = !SD.store.progress.isDone(node.id);
        SD.store.progress.setDone(node.id, now);
        doneBtn.classList.toggle("on", now);
        doneBtn.textContent = now ? "✓ Done" : "Mark as done";
      });
    }
  }

  // Table of contents for the full lesson page
  function toc(root) {
    return Array.from(root.querySelectorAll("section.ls[data-sec]")).map(s => ({
      id: s.dataset.sec, title: s.querySelector("h2")?.textContent || s.dataset.sec, el: s
    }));
  }

  SD.lesson = { render, wire, toc, paintTradeoff };
})();
