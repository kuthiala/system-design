// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const NODE_W = 280, NODE_H = 60, H_GAP = 300, V_GAP = 60;
const MIN_NODE_GAP = NODE_H + 16;

const PHASE_COLORS = {
  root:"#475569", Requirements:"#6b7280", Architecture:"#7c3aed",
  "API Layer":"#2563eb", Database:"#0891b2", Sharding:"#d97706",
  Compute:"#059669", Messaging:"#9333ea", Storage:"#0284c7",
  Reliability:"#dc2626", Networking:"#0369a1", Observability:"#16a34a",
  Security:"#7c3aed", Operations:"#64748b", Analytics:"#b45309",
  Cost:"#15803d", "ML/AI":"#ec4899", "Multi-tenancy":"#06b6d4",
  "Real-time":"#a855f7", Compliance:"#84cc16", Testing:"#fb923c",
  Migrations:"#facc15"
};

// ══════════════════════════════════════════════════════════════
// TREE ASSEMBLY
// ══════════════════════════════════════════════════════════════

const TREE = {
  name:"System Design Framework", id:"root", icon:"⚙️", phase:"root",
  short:"End-to-end decisions for any scale",
  detail:{
    what:"A systematic decision framework that adapts every architectural concept to your company's actual scale. Start at Phase 1 and follow the branches that match your requirements.",
    why:"Wrong architecture for your scale wastes money (over-engineered) or causes outages (under-engineered). This tree gives you the right answer at each scale.",
    numbers:"Thresholds: Small <1K RPS, Medium 1K–50K RPS, Large 50K–500K RPS, Hyper >500K RPS"
  },
  tradeoffs:[
    {axis:"Over-engineering vs Under-engineering", left:"Too simple → outages", right:"Too complex → slow velocity", pos:0.5},
    {axis:"Build vs Buy", left:"Custom → control", right:"Managed → speed", pos:0.5}
  ],
  levelUp:[],
  children:[
    PHASE_REQUIREMENTS, PHASE_ARCHITECTURE, PHASE_API, PHASE_DATABASE,
    PHASE_SHARDING, PHASE_COMPUTE, PHASE_MESSAGING, PHASE_STORAGE,
    PHASE_RELIABILITY, PHASE_NETWORKING, PHASE_OBSERVABILITY, PHASE_SECURITY,
    PHASE_OPERATIONS, PHASE_ANALYTICS, PHASE_COST, PHASE_ML,
    PHASE_MULTITENANCY, PHASE_REALTIME, PHASE_COMPLIANCE, PHASE_TESTING,
    PHASE_MIGRATIONS
  ]
};

// Annotate every node with depth, parent, and a stable ID
(function flatten(node, parent = null, depth = 0) {
  node._parent = parent;
  node._depth = depth;
  node._collapsed = depth >= 1;
  node._id = node.id || Math.random().toString(36).slice(2);
  if (node.children) node.children.forEach(c => flatten(c, node, depth + 1));
})(TREE);

// ══════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════

let selectedNode    = null;
let searchTerm      = "";
let activeExample   = null;
let examplesCollapsed = false;
let _initialized    = false;  // gates localStorage writes during startup

// ══════════════════════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════════════════════

const PERSIST_KEYS = {
  zoom:             "sd_zoom",
  expanded:         "sd_expanded",
  node:             "sd_node",
  panelWidth:       "sd_panel_w",
  example:          "sd_example",
  exCollapsed:      "sd_ex_collapsed",
};

const persist = {
  save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  },
  load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  },
  clearAll() {
    Object.values(PERSIST_KEYS).forEach(k => this.remove(k));
  },

  saveZoom(transform) {
    if (!_initialized) return;
    this.save(PERSIST_KEYS.zoom, {k: transform.k, x: transform.x, y: transform.y});
  },
  saveExpandedNodes() {
    if (!_initialized) return;
    const expanded = [];
    (function collect(n) {
      if (n.id && n._depth >= 1 && !n._collapsed) expanded.push(n.id);
      if (n.children) n.children.forEach(collect);
    })(TREE);
    this.save(PERSIST_KEYS.expanded, expanded);
  },
  saveSelectedNode(node) {
    if (!_initialized) return;
    this.save(PERSIST_KEYS.node, node.id || "");
  },
  savePanelWidth(width) {
    this.save(PERSIST_KEYS.panelWidth, width);
  },
  saveExample(id) {
    this.save(PERSIST_KEYS.example, id);
  },
  saveExamplesCollapsed(value) {
    this.save(PERSIST_KEYS.exCollapsed, value);
  },
};

// ══════════════════════════════════════════════════════════════
// D3 / ZOOM
// ══════════════════════════════════════════════════════════════

const svg = d3.select("#svg");
const g   = svg.append("g").attr("id", "tree-g");

const zoom = d3.zoom()
  .scaleExtent([0.05, 2.5])
  .on("zoom", e => {
    g.attr("transform", e.transform);
    persist.saveZoom(e.transform);
  });

svg.call(zoom).on("dblclick.zoom", null);

// ══════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════

function getVisible(node, result = []) {
  result.push(node);
  if (!node._collapsed && node.children) {
    node.children.forEach(c => getVisible(c, result));
  }
  return result;
}

function layout(root) {
  const nodes    = getVisible(root);
  const phases   = root.children || [];
  const rootCentreY = ((phases.length - 1) * V_GAP) / 2;

  nodes.forEach(n => { n._x = n._depth * H_GAP; });
  root._y = 0;
  phases.forEach((ph, i) => { ph._y = i * V_GAP - rootCentreY; });

  // Centre children around their parent
  function positionChildren(node) {
    if (!node.children || node._collapsed) return;
    const visible = node.children.filter(c => nodes.includes(c));
    if (!visible.length) return;
    visible.forEach((c, i) => {
      c._y = node._y + (i - (visible.length - 1) / 2) * V_GAP;
    });
    visible.forEach(positionChildren);
  }
  phases.forEach(positionChildren);

  // Returns the Y bounding box of a subtree
  function subtreeBounds(node) {
    let lo = node._y, hi = node._y;
    if (!node._collapsed && node.children) {
      node.children.forEach(c => {
        if (!nodes.includes(c)) return;
        const b = subtreeBounds(c);
        lo = Math.min(lo, b.lo);
        hi = Math.max(hi, b.hi);
      });
    }
    return { lo, hi };
  }

  function shiftSubtree(node, dy) {
    node._y += dy;
    if (!node._collapsed && node.children) {
      node.children.forEach(c => { if (nodes.includes(c)) shiftSubtree(c, dy); });
    }
  }

  // Push phase subtrees apart until no overlaps remain (max 20 passes)
  for (let iter = 0; iter < 20; iter++) {
    let moved = false;
    for (let i = 0; i < phases.length - 1; i++) {
      const [a, b] = [phases[i], phases[i + 1]];
      if (!nodes.includes(a) || !nodes.includes(b)) continue;
      const gap = subtreeBounds(a).hi + MIN_NODE_GAP - subtreeBounds(b).lo;
      if (gap > 0) { shiftSubtree(b,  gap); moved = true; }
    }
    for (let i = phases.length - 2; i >= 0; i--) {
      const [a, b] = [phases[i], phases[i + 1]];
      if (!nodes.includes(a) || !nodes.includes(b)) continue;
      const gap = subtreeBounds(a).hi + MIN_NODE_GAP - subtreeBounds(b).lo;
      if (gap > 0) { shiftSubtree(a, -gap); moved = true; }
    }
    if (!moved) break;
  }

  // Final sweep: resolve per-depth overlaps
  const byDepth = {};
  nodes.forEach(n => {
    (byDepth[n._depth] = byDepth[n._depth] || []).push(n);
  });
  Object.values(byDepth).forEach(grp => {
    grp.sort((a, b) => a._y - b._y);
    for (let i = 1; i < grp.length; i++) {
      grp[i]._y = Math.max(grp[i]._y, grp[i - 1]._y + MIN_NODE_GAP);
    }
    for (let i = grp.length - 2; i >= 0; i--) {
      grp[i]._y = Math.min(grp[i]._y, grp[i + 1]._y - MIN_NODE_GAP);
    }
    for (let i = 1; i < grp.length; i++) {
      grp[i]._y = Math.max(grp[i]._y, grp[i - 1]._y + MIN_NODE_GAP);
    }
  });

  return nodes;
}

// ══════════════════════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════════════════════

function render() {
  persist.saveExpandedNodes();

  const nodes = layout(TREE);

  // ── Links ──
  const linkData = nodes.filter(n => n._parent && nodes.includes(n._parent));
  const links = g.selectAll(".link").data(linkData, d => d._id);

  links.enter().append("path").attr("class", "link")
    .merge(links)
    .attr("d", d => {
      const sx = d._parent._x + NODE_W, sy = d._parent._y + NODE_H / 2;
      const tx = d._x,                 ty = d._y + NODE_H / 2;
      const mx = (sx + tx) / 2;
      return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
    })
    .classed("hl", d => d === selectedNode || d._parent === selectedNode);

  links.exit().remove();

  // ── Nodes ──
  const nodeGs = g.selectAll(".nd").data(nodes, d => d._id);
  const enter  = nodeGs.enter().append("g").attr("class", "nd");

  enter.append("rect").attr("width", NODE_W).attr("height", NODE_H).attr("rx", 7).attr("stroke-width", 1);
  enter.append("text").attr("class", "nd-icon").attr("x", 12).attr("y", 22).style("font-size", "13px").style("font-family", "sans-serif");
  enter.append("text").attr("class", "nd-name").attr("x", 32).attr("y", 20).style("font-size", "11px").style("font-weight", "600").style("fill", "#e2e8f0");
  enter.append("text").attr("class", "nd-short").attr("x", 32).attr("y", 36).style("font-size", "9px").style("fill", "#64748b");
  enter.append("text").attr("class", "nd-expand-btn").attr("x", NODE_W - 14).attr("y", NODE_H / 2 + 5).style("font-size", "11px").style("fill", "#475569").style("cursor", "pointer").style("user-select", "none");

  const all = enter.merge(nodeGs);

  all.attr("transform", d => `translate(${d._x},${d._y - NODE_H / 2})`);

  all.select("rect")
    .attr("fill",   d => colorFor(d, d === selectedNode ? 1.0 : 0.13))
    .attr("stroke", d => colorFor(d, d === selectedNode ? 1.0 : 0.4))
    .attr("opacity", d => {
      if (!searchTerm) return 1;
      const matches = d.name.toLowerCase().includes(searchTerm) || (d.short || "").toLowerCase().includes(searchTerm);
      return matches ? 1 : 0.2;
    });

  all.select(".nd-icon").text(d => d.icon || "•");
  all.select(".nd-name").text(d => d.name);
  all.select(".nd-short").text(_ => "");

  all.select(".nd-expand-btn")
    .text(d => (d.children?.length) ? (d._collapsed ? "▸" : "▾") : "")
    .on("click", (e, d) => {
      e.stopPropagation();
      if (d.children?.length) { d._collapsed = !d._collapsed; render(); }
    });

  all.on("click", (_, d) => {
    if (d.children?.length) d._collapsed = !d._collapsed;
    selectedNode = d;
    showDetail(d);
    render();
    updateBreadcrumb(d);
  });

  nodeGs.exit().remove();
}

function colorFor(node, alpha) {
  const hex = PHASE_COLORS[node.phase] || "#475569";
  if (alpha >= 1) return hex;
  // Convert to rgba by appending hex alpha
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return hex + a;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ══════════════════════════════════════════════════════════════
// DETAIL PANEL — HTML BUILDERS
// ══════════════════════════════════════════════════════════════

function section(title, body) {
  return `<div class="ds"><h3>${title}</h3>${body}</div>`;
}

function buildSizeCards(cfg) {
  const labels = { small:"(Startup)", medium:"(Growth)", large:"(Scale-up)", hyper:"(Hyper-scale)" };
  const cards = ["small","medium","large","hyper"].map(s => {
    const c = cfg[s];
    if (!c) return "";
    const tools = c.tools ? `<div class="sc-tools">${c.tools.map(t => `<span class="tool">${t}</span>`).join("")}</div>` : "";
    return `<div class="sc ${s}">
      <div class="sc-lbl">${s.toUpperCase()} ${labels[s]}</div>
      <div class="sc-rng">${c.range}</div>
      <div class="sc-rec">${c.rec}</div>
      ${tools}
    </div>`;
  }).join("");
  return section("By Company Size", `<div class="size-configs">${cards}</div>`);
}

function buildTradeoffs(tradeoffs) {
  const items = tradeoffs.map(t => {
    const pos = t.pos ?? 0.5;
    const pct = pos * 100;
    // left side is favored when pos < 0.5, right when pos > 0.5
    const leftOp  = pos < 0.5 ? 1 : 0.45;
    const rightOp = pos > 0.5 ? 1 : 0.45;
    return `<div class="ta">
      <div class="ta-name">↔ ${t.axis}</div>
      <div class="ta-labels">
        <div class="ta-l" style="opacity:${leftOp}">${t.left}</div>
        <div class="ta-r" style="opacity:${rightOp}">${t.right}</div>
      </div>
      <div class="ta-track-wrap">
        <div class="ta-track"><div class="ta-mk" style="left:${pct}%"></div></div>
      </div>
      <div class="ta-arrows">
        <div class="ta-arrow-l">← more this</div>
        <div class="ta-arrow-r">more this →</div>
      </div>
    </div>`;
  }).join("");
  return section("Tradeoff Axes", items);
}

function buildLevelUps(levelUps) {
  const items = levelUps.map(lu => {
    const cls   = lu.from === "small" ? "s-m" : lu.from === "medium" ? "m-l" : "l-h";
    const arrow = lu.from === "small" ? "S→M" : lu.from === "medium" ? "M→L" : "L→H";
    return `<div class="lu">
      <div><span class="lu-badge ${cls}">${arrow}</span></div>
      <div class="lu-trig">⚡ ${lu.trigger}</div>
      <div class="lu-act">→ ${lu.action}</div>
    </div>`;
  }).join("");
  return section("Level-Up Thresholds", items);
}

function buildFormulas(formulas) {
  const items = formulas.map(f => {
    const note = f.note ? `<div style="color:#64748b;font-size:10px;margin-top:4px;font-family:sans-serif">${f.note}</div>` : "";
    return `<div class="formula"><strong style="color:#c4b5fd">${f.name}:</strong><br>${f.expr}${note}</div>`;
  }).join("");
  return section("Capacity Formulas", items);
}

function buildAntiPatterns(items) {
  return section("Anti-Patterns ❌", items.map(ap =>
    `<div class="ap"><div class="ap-t">${ap.name}</div><div class="ap-d">${ap.desc}</div></div>`
  ).join(""));
}

function buildPitfalls(items) {
  return section("Common Pitfalls ⚠️", items.map(p =>
    `<div class="pit"><div class="pit-t">${p.name}</div><div class="pit-d">${p.desc}</div></div>`
  ).join(""));
}

function buildExamples(items) {
  return section("Real-World Examples 🌍", items.map(e =>
    `<div class="ex"><div class="ex-t">${e.name}</div><div class="ex-d">${e.desc}</div></div>`
  ).join(""));
}

function buildRelatedLinks(related) {
  const links = related.map(r =>
    `<span class="rel-link" data-target="${r.id}">${r.label || r.id}</span>`
  ).join("");
  return section("Related Concepts", `<div class="related">${links}</div>`);
}

function buildExampleOverlay(node) {
  if (!activeExample?.nodes) return "";

  const ex        = activeExample.nodes[node.id];
  const openClass = examplesCollapsed ? "" : "open";
  let content;

  if (ex) {
    content = `<div class="ds ex-overlay">
      <h3>${activeExample.icon || "📦"} Applied to: ${activeExample.name}</h3>
      ${ex.why       ? `<div class="ex-why"><span class="ex-lbl">Why</span><div>${ex.why}</div></div>` : ""}
      ${ex.context   ? `<div class="ex-why"><span class="ex-lbl">Context</span><div>${ex.context}</div></div>` : ""}
      ${ex.tradeoffs ? `<div class="ex-why"><span class="ex-lbl">Tradeoffs</span><div>${ex.tradeoffs}</div></div>` : ""}
      ${ex.risks     ? `<div class="ex-notes"><span class="ex-lbl">Risks & Mitigations</span><div>${ex.risks}</div></div>` : ""}
      ${ex.notes     ? `<div class="ex-notes"><span class="ex-lbl">Notes</span><div>${ex.notes}</div></div>` : ""}
      <div class="ex-decision" style="margin-top:10px;padding-top:8px;border-top:1px solid #5b21b6">
        <span class="ex-lbl">Decision</span><div>${ex.decision}</div>
      </div>
    </div>`;
  } else {
    content = `<div class="ds ex-overlay-empty">
      <h3>${activeExample.icon || "📦"} ${activeExample.name}</h3>
      <p style="color:#64748b;font-size:11px;font-style:italic">No specific guidance for this node. Add it in
        <code>examples/${activeExample.id}.js</code> under <code>nodes["${node.id}"]</code>.</p>
    </div>`;
  }

  return `<div class="dp-examples-section">
    <button class="dp-examples-toggle ${openClass}">📦 Applied Example</button>
    <div class="dp-examples-content ${openClass}">${content}</div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// DETAIL PANEL — CONTROLLER
// ══════════════════════════════════════════════════════════════

function showDetail(node) {
  document.getElementById("dp").classList.add("open");
  document.getElementById("dp-icon").textContent  = node.icon  || "";
  document.getElementById("dp-title").textContent = node.name;
  document.getElementById("dp-phase").textContent = node.phase || "";
  persist.saveSelectedNode(node);

  let html = "";

  if (node.short) {
    html += `<div style="color:#94a3b8;font-size:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1e2433">${node.short}</div>`;
  }

  if (node.detail) {
    const d = node.detail;
    if (d.what)    html += section("What",    `<p>${d.what}</p>`);
    if (d.why)     html += section("Why",     `<p>${d.why}</p>`);
    if (d.numbers) html += section("Numbers", `<p style="color:#fbbf24;font-size:11px">📐 ${d.numbers}</p>`);
  }

  if (node.sizes_cfg)                  html += buildSizeCards(node.sizes_cfg);
  if (node.tradeoffs?.length)          html += buildTradeoffs(node.tradeoffs);
  if (node.levelUp?.length)            html += buildLevelUps(node.levelUp);
  if (node.formulas?.length)           html += buildFormulas(node.formulas);
  if (node.antiPatterns?.length)       html += buildAntiPatterns(node.antiPatterns);
  if (node.pitfalls?.length)           html += buildPitfalls(node.pitfalls);
  if (node.examples?.length)           html += buildExamples(node.examples);
  if (node.related?.length)            html += buildRelatedLinks(node.related);
  if (activeExample)                   html += buildExampleOverlay(node);

  document.getElementById("dp-body").innerHTML = html;

  // Wire up related-concept navigation links
  document.querySelectorAll(".rel-link").forEach(el => {
    el.onclick = () => {
      const target = findNodeById(TREE, el.dataset.target);
      if (target) navigateTo(target);
    };
  });

  // Wire up example section collapse toggle
  document.querySelectorAll(".dp-examples-toggle").forEach(btn => {
    btn.onclick = () => {
      examplesCollapsed = !examplesCollapsed;
      btn.classList.toggle("open", !examplesCollapsed);
      btn.nextElementSibling.classList.toggle("open", !examplesCollapsed);
      persist.saveExamplesCollapsed(examplesCollapsed);
    };
  });
}

function findNodeById(root, id) {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// CANVAS — VIEW HELPERS
// ══════════════════════════════════════════════════════════════

function fitView() {
  const nodes = layout(TREE);
  if (!nodes.length) return;
  const xs = nodes.map(n => n._x), ys = nodes.map(n => n._y);
  const minX = Math.min(...xs) - 20,     maxX = Math.max(...xs) + NODE_W + 20;
  const minY = Math.min(...ys) - NODE_H - 20, maxY = Math.max(...ys) + NODE_H + 20;
  const cw    = document.getElementById("canvas-wrap").offsetWidth;
  const ch    = document.getElementById("canvas-wrap").offsetHeight;
  const scale = Math.min(cw / (maxX - minX), ch / (maxY - minY), 1.5);
  const tx    = cw / 2 - scale * (minX + maxX) / 2;
  const ty    = ch / 2 - scale * (minY + maxY) / 2;
  svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

function panTo(node, scale = 0.9) {
  const cw = document.getElementById("canvas-wrap").offsetWidth;
  const ch = document.getElementById("canvas-wrap").offsetHeight;
  const tx = cw / 2 - scale * (node._x + NODE_W / 2);
  const ty = ch / 2 - scale * node._y;
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

function updateBreadcrumb(node) {
  const trail = [];
  let n = node;
  while (n) { trail.unshift(n.name); n = n._parent; }
  document.getElementById("breadcrumb").textContent = trail.join(" › ");
}

function navigateTo(node) {
  node._collapsed = false;
  if (node._parent) node._parent._collapsed = false;
  render();
  panTo(node);
  selectedNode = node;
  showDetail(node);
  render();
  updateBreadcrumb(node);
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR — PHASE NAV
// ══════════════════════════════════════════════════════════════

(function buildPhaseNav() {
  const nav = document.getElementById("phase-nav");
  TREE.children.forEach(phase => {
    const el  = document.createElement("div");
    el.className   = "pn";
    el.dataset.id  = phase.id;

    const dot = document.createElement("div");
    dot.className  = "pn-dot";
    dot.style.background = PHASE_COLORS[phase.phase] || "#475569";

    el.appendChild(dot);
    el.appendChild(document.createTextNode(phase.name));

    el.onclick = () => {
      document.querySelectorAll(".pn").forEach(x => x.classList.remove("active"));
      el.classList.add("active");
      phase._collapsed = !phase._collapsed;
      selectedNode = phase;
      showDetail(phase);
      render();
      updateBreadcrumb(phase);
      panTo(phase);
    };

    nav.appendChild(el);
  });
})();

// ══════════════════════════════════════════════════════════════
// SIDEBAR — SEARCH
// ══════════════════════════════════════════════════════════════

document.getElementById("search").oninput = function () {
  searchTerm = this.value.toLowerCase().trim();
  if (searchTerm) {
    (function expandAll(n) {
      n._collapsed = false;
      if (n.children) n.children.forEach(expandAll);
    })(TREE);
  }
  render();
};

// ══════════════════════════════════════════════════════════════
// SIDEBAR — EXAMPLE SELECTOR
// ══════════════════════════════════════════════════════════════

(function initExampleSelector() {
  const sel      = document.getElementById("example-select");
  const overview = document.getElementById("example-overview");
  if (!sel) return;

  const examples = window.EXAMPLES || [];
  examples.forEach(ex => {
    const opt = document.createElement("option");
    opt.value       = ex.id;
    opt.textContent = `${ex.icon || "📦"} ${ex.name}`;
    sel.appendChild(opt);
  });

  function renderOverview() {
    if (!activeExample) {
      overview.innerHTML = "";
      overview.classList.remove("active");
      return;
    }
    overview.classList.add("active");
    overview.innerHTML = `
      <div class="ex-tagline">${activeExample.tagline || ""}</div>
      <div class="ex-overview-text">${activeExample.overview || ""}</div>
    `;
  }

  sel.onchange = () => {
    activeExample = examples.find(e => e.id === sel.value) || null;
    persist.saveExample(sel.value);
    renderOverview();
    if (selectedNode) showDetail(selectedNode);
  };

  // Runtime example upload
  const uploadInput = document.getElementById("example-upload");
  const uploadError = document.getElementById("example-upload-error");
  if (uploadInput) {
    uploadInput.onchange = function () {
      const file = this.files[0];
      if (!file) return;
      uploadError.textContent = "";
      const reader = new FileReader();
      reader.onload = function (e) {
        const before = examples.length;
        try {
          // eslint-disable-next-line no-new-func
          new Function("window", e.target.result)(window);
        } catch (err) {
          uploadError.textContent = "Error loading example: " + err.message;
          return;
        }
        const added = window.EXAMPLES.slice(before);
        if (added.length === 0) {
          uploadError.textContent = "No example found — make sure the file pushes to window.EXAMPLES.";
          return;
        }
        added.forEach(ex => {
          examples.push(ex);
          const opt = document.createElement("option");
          opt.value       = ex.id;
          opt.textContent = `${ex.icon || "📦"} ${ex.name}`;
          sel.appendChild(opt);
        });
        // Auto-select the first newly added example
        sel.value     = added[0].id;
        activeExample = added[0];
        persist.saveExample(sel.value);
        renderOverview();
        if (selectedNode) showDetail(selectedNode);
      };
      reader.readAsText(file);
      // Reset so the same file can be re-uploaded if needed
      this.value = "";
    };
  }
})();

/* SIDEBAR COLLAPSE/EXPAND */
(function initSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  if (!sidebar || !toggleBtn) return;

  function setIcon() {
    if (sidebar.classList.contains("collapsed")) {
      toggleBtn.textContent = ">";
      toggleBtn.setAttribute("aria-label", "Expand sidebar");
      toggleBtn.setAttribute("title", "Expand sidebar");
    } else {
      toggleBtn.textContent = "<";
      toggleBtn.setAttribute("aria-label", "Collapse sidebar");
      toggleBtn.setAttribute("title", "Collapse sidebar");
    }
  }

  // Restore state if persisted
  const collapsed = localStorage.getItem("sd_sidebar_collapsed") === "1";
  if (collapsed) sidebar.classList.add("collapsed");
  setIcon();

  // Highlight feature removed

  toggleBtn.onclick = () => {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem("sd_sidebar_collapsed", sidebar.classList.contains("collapsed") ? "1" : "0");
    setIcon();
  };
})();

// ══════════════════════════════════════════════════════════════
// PANEL — RESIZE, EXPAND, CLOSE
// ══════════════════════════════════════════════════════════════

(function initPanelResize() {
  const dp      = document.getElementById("dp");
  const handle  = document.getElementById("dp-resize");
  const sidebar = document.getElementById("sidebar");
  // Toggle button is 32px wide and must stay visible when sidebar is collapsed
  const TOGGLE_BTN_W = 40;
  let startX, startW, dragging = false;

  function getMaxPanelWidth() {
    const sidebarW = sidebar.classList.contains("collapsed") ? TOGGLE_BTN_W : sidebar.offsetWidth;
    return window.innerWidth - sidebarW;
  }

  function clampWidth(w) {
    return Math.min(Math.max(w, 280), getMaxPanelWidth());
  }

  // Pointer Events API for full touch/mouse/stylus support
  const onPointerDown = e => {
    if (e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "mouse") {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startW = dp.offsetWidth;
      handle.classList.add("dragging");
      document.body.style.cursor    = "col-resize";
      document.body.style.userSelect = "none";

      const onPointerMove = ev => {
        if (!dragging) return;
        const delta = startX - ev.clientX;
        dp.style.width = clampWidth(startW + delta) + "px";
      };

      const onPointerUp = ev => {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove("dragging");
        document.body.style.cursor    = "";
        document.body.style.userSelect = "";
        persist.savePanelWidth(dp.style.width);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup",   onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup",   onPointerUp, { passive: false });
      window.addEventListener("pointercancel", onPointerUp, { passive: false });
    }
  };

  handle.addEventListener("pointerdown", onPointerDown, { passive: false });

  // Fallback for browsers without Pointer Events (very rare)
  if (!window.PointerEvent) {
    handle.addEventListener("mousedown", e => {
      e.preventDefault();
      startX = e.clientX;
      startW = dp.offsetWidth;
      handle.classList.add("dragging");
      document.body.style.cursor    = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = e => {
        dp.style.width = clampWidth(startW + (startX - e.clientX)) + "px";
      };

      const onUp = () => {
        handle.classList.remove("dragging");
        document.body.style.cursor    = "";
        document.body.style.userSelect = "";
        persist.savePanelWidth(dp.style.width);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    });

    handle.addEventListener("touchstart", e => {
      e.preventDefault();
      startX = e.touches[0].clientX;
      startW = dp.offsetWidth;
      handle.classList.add("dragging");
      document.body.style.cursor    = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = e => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        dp.style.width = clampWidth(startW + (startX - clientX)) + "px";
      };

      const onUp = () => {
        handle.classList.remove("dragging");
        document.body.style.cursor    = "";
        document.body.style.userSelect = "";
        persist.savePanelWidth(dp.style.width);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend",  onUp);
      };

      document.addEventListener("touchmove", onMove);
      document.addEventListener("touchend",  onUp);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    }, { passive: false });
  }
})();

document.getElementById("dp-expand").onclick = () => {
  const dp = document.getElementById("dp");
  dp.style.width = (dp.style.width === "700px" || dp.style.width === "") ? "1000px" : "700px";
};

document.getElementById("dp-close").onclick = () => {
  document.getElementById("dp").classList.remove("open");
  selectedNode = null;
  persist.remove(PERSIST_KEYS.node);
  render();
};

// ══════════════════════════════════════════════════════════════
// CANVAS CONTROLS
// ══════════════════════════════════════════════════════════════

document.getElementById("zi").onclick  = () => svg.transition().call(zoom.scaleBy, 1.4);
document.getElementById("zo").onclick  = () => svg.transition().call(zoom.scaleBy, 0.7);
document.getElementById("fit").onclick = resetState;
document.getElementById("rst").onclick = () => {
  TREE._collapsed = false;
  TREE.children?.forEach(c => { c._collapsed = false; });
  render();
  fitView();
};

// ══════════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ══════════════════════════════════════════════════════════════

document.addEventListener("keydown", e => {
  if (document.activeElement === document.getElementById("search")) return;
  if (!selectedNode) return;

  const nodes  = layout(TREE);
  const idx    = nodes.indexOf(selectedNode);
  const hasKids = selectedNode.children?.length > 0;

  const actions = {
    ArrowRight() {
      if (hasKids && selectedNode._collapsed) { selectedNode._collapsed = false; render(); }
    },
    ArrowLeft() {
      if (hasKids && !selectedNode._collapsed) {
        selectedNode._collapsed = true; render();
      } else if (selectedNode._parent) {
        selectedNode = selectedNode._parent;
        selectedNode._collapsed = true;
        showDetail(selectedNode); render(); updateBreadcrumb(selectedNode);
      }
    },
    ArrowDown() {
      if (idx < nodes.length - 1) {
        selectedNode = nodes[idx + 1];
        showDetail(selectedNode); render(); updateBreadcrumb(selectedNode);
      }
    },
    ArrowUp() {
      if (idx > 0) {
        selectedNode = nodes[idx - 1];
        showDetail(selectedNode); render(); updateBreadcrumb(selectedNode);
      }
    },
  };

  if (actions[e.key]) { e.preventDefault(); actions[e.key](); }
});

// ══════════════════════════════════════════════════════════════
// RESET
// ══════════════════════════════════════════════════════════════

function resetState() {
  persist.clearAll();

  (function collapseAll(n) {
    n._collapsed = n._depth >= 1;
    if (n.children) n.children.forEach(collapseAll);
  })(TREE);

  const dp = document.getElementById("dp");
  dp.classList.remove("open");
  dp.style.width  = "700px";
  selectedNode    = null;

  activeExample     = null;
  examplesCollapsed = false;
  const sel = document.getElementById("example-select");
  if (sel) sel.value = "";
  const overview = document.getElementById("example-overview");
  if (overview) { overview.innerHTML = ""; overview.classList.remove("active"); }

  render();
  fitView();
}


// ══════════════════════════════════════════════════════════════
// INIT — restore persisted state, then render
// ══════════════════════════════════════════════════════════════

TREE._collapsed = false;

// 1. Restore expanded nodes before first render
const savedExpanded = persist.load(PERSIST_KEYS.expanded);
if (savedExpanded) {
  const expandedIds = new Set(savedExpanded);
  (function restoreCollapse(n) {
    if (n.id && n._depth >= 1) n._collapsed = !expandedIds.has(n.id);
    if (n.children) n.children.forEach(restoreCollapse);
  })(TREE);
}

// 2. Restore active example before render + showDetail
const savedExampleId = persist.load(PERSIST_KEYS.example);
if (savedExampleId) {
  const ex = (window.EXAMPLES || []).find(e => e.id === savedExampleId);
  if (ex) {
    activeExample = ex;
    const sel = document.getElementById("example-select");
    if (sel) sel.value = savedExampleId;
    const overview = document.getElementById("example-overview");
    if (overview) {
      overview.classList.add("active");
      overview.innerHTML = `
        <div class="ex-tagline">${ex.tagline || ""}</div>
        <div class="ex-overview-text">${ex.overview || ""}</div>
      `;
    }
  }
}

// 3. Restore selected node before render (so highlight is drawn on first pass)
const savedNodeId    = persist.load(PERSIST_KEYS.node);
const restoredNode   = savedNodeId ? findNodeById(TREE, savedNodeId) : null;
if (restoredNode) selectedNode = restoredNode;

// 4. Restore examples-collapsed state
examplesCollapsed = persist.load(PERSIST_KEYS.exCollapsed) === true;

render();
_initialized = true;

// 5. Restore zoom — skip fitView if a saved transform exists
const savedZoom = persist.load(PERSIST_KEYS.zoom);
if (savedZoom) {
  svg.call(zoom.transform, d3.zoomIdentity.translate(savedZoom.x, savedZoom.y).scale(savedZoom.k));
} else {
  setTimeout(fitView, 100);
}

// 6. Populate detail panel for the restored node
if (restoredNode) showDetail(restoredNode);

// 7. Restore panel width
const savedPanelWidth = persist.load(PERSIST_KEYS.panelWidth);
if (savedPanelWidth) document.getElementById("dp").style.width = savedPanelWidth;

window.addEventListener("resize", render);
