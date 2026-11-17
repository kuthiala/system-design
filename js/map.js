// ══════════════════════════════════════════════════════════════
// MAP — the D3 decision tree, ported from the original app.js.
// Node tiles are drawn exactly as before (name + tradeoff axes);
// the detail panel renders the
// same lesson HTML as the Learn view.
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  // Geometry and tile drawing ported verbatim from the original app.js (commit 9b088a9).
  const NODE_W = 238, NODE_H = 150, H_GAP = 300, V_GAP = 60;
  const MIN_NODE_GAP = NODE_H + 16;

  let svg, g, zoom, TREE;
  let selectedNode = null, searchTerm = "", mounted = false, visible = false;
  const K = { zoom: "map.zoom", expanded: "map.expanded", node: "map.node", panelW: "map.panelW" };

  // ── Layout ──
  function getVisible(node, out = []) {
    out.push(node);
    if (!node._collapsed && node.children) node.children.forEach(c => getVisible(c, out));
    return out;
  }

  function layout(root) {
    const nodes = getVisible(root);
    const phases = root.children || [];
    nodes.forEach(n => { n._x = n._depth * H_GAP; });
    root._y = 0;
    phases.forEach((ph, i) => { ph._y = i * V_GAP - ((phases.length - 1) * V_GAP) / 2; });

    function positionChildren(node) {
      if (!node.children || node._collapsed) return;
      const vis = node.children.filter(c => nodes.includes(c));
      vis.forEach((c, i) => { c._y = node._y + (i - (vis.length - 1) / 2) * V_GAP; });
      vis.forEach(positionChildren);
    }
    phases.forEach(positionChildren);

    function bounds(node) {
      let lo = node._y, hi = node._y;
      if (!node._collapsed && node.children) node.children.forEach(c => { if (!nodes.includes(c)) return; const b = bounds(c); lo = Math.min(lo, b.lo); hi = Math.max(hi, b.hi); });
      return { lo, hi };
    }
    function shift(node, dy) { node._y += dy; if (!node._collapsed && node.children) node.children.forEach(c => { if (nodes.includes(c)) shift(c, dy); }); }

    for (let iter = 0; iter < 20; iter++) {
      let moved = false;
      for (let i = 0; i < phases.length - 1; i++) {
        const gap = bounds(phases[i]).hi + MIN_NODE_GAP - bounds(phases[i + 1]).lo;
        if (gap > 0) { shift(phases[i + 1], gap); moved = true; }
      }
      for (let i = phases.length - 2; i >= 0; i--) {
        const gap = bounds(phases[i]).hi + MIN_NODE_GAP - bounds(phases[i + 1]).lo;
        if (gap > 0) { shift(phases[i], -gap); moved = true; }
      }
      if (!moved) break;
    }
    const byDepth = {};
    nodes.forEach(n => (byDepth[n._depth] = byDepth[n._depth] || []).push(n));
    Object.values(byDepth).forEach(grp => {
      grp.sort((a, b) => a._y - b._y);
      for (let i = 1; i < grp.length; i++) grp[i]._y = Math.max(grp[i]._y, grp[i - 1]._y + MIN_NODE_GAP);
      for (let i = grp.length - 2; i >= 0; i--) grp[i]._y = Math.min(grp[i]._y, grp[i + 1]._y - MIN_NODE_GAP);
      for (let i = 1; i < grp.length; i++) grp[i]._y = Math.max(grp[i]._y, grp[i - 1]._y + MIN_NODE_GAP);
    });
    return nodes;
  }

  // ── Render ──
  function wrap(text, max) {
    const words = String(text || "").split(/\s+/), lines = []; let cur = "";
    words.forEach(w => { if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; });
    if (cur) lines.push(cur);
    return lines;
  }

  function colorFor(node, alpha) {
    const hex = SD.colorOf(node);
    return alpha >= 1 ? hex : hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
  }

  function render() {
    saveExpanded();
    const nodes = layout(TREE);
    const done = SD.store.progress.all();

    const links = g.selectAll(".link").data(nodes.filter(n => n._parent && nodes.includes(n._parent)), d => d._id);
    links.enter().append("path").attr("class", "link").merge(links)
      .attr("d", d => { const sx = d._parent._x + NODE_W, sy = d._parent._y + NODE_H / 2, tx = d._x, ty = d._y + NODE_H / 2, mx = (sx + tx) / 2; return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`; })
      .classed("hl", d => d === selectedNode || d._parent === selectedNode);
    links.exit().remove();

    const nodeGs = g.selectAll(".nd").data(nodes, d => d._id);
    const enter = nodeGs.enter().append("g").attr("class", "nd");
    enter.append("rect").attr("width", NODE_W).attr("height", NODE_H).attr("rx", 7).attr("stroke-width", 1);
    enter.append("text").attr("class", "nd-icon").attr("x", 12).attr("y", 22).style("font-size", "13px").style("font-family", "sans-serif");
    enter.append("text").attr("class", "nd-name").attr("x", 32).attr("y", 20).style("font-size", "11px").style("font-weight", "600").style("fill", "#e2e8f0");
    enter.append("text").attr("class", "nd-done").attr("x", NODE_W - 14).attr("y", 20).attr("text-anchor", "end").style("font-size", "10px").style("fill", "#22c55e").text("✓");
    enter.append("line").attr("class", "nd-sep-main").attr("x1", 12).attr("x2", NODE_W - 12).attr("y1", 28).attr("y2", 28).style("stroke", "#334155").style("stroke-width", 0.5);
    enter.append("g").attr("class", "nd-axes");
    enter.append("text").attr("class", "nd-expand-btn").attr("x", NODE_W - 14).attr("y", NODE_H / 2 + 5).style("font-size", "11px").style("fill", "#475569").style("cursor", "pointer").style("user-select", "none");

    const all = enter.merge(nodeGs);
    all.attr("transform", d => `translate(${d._x},${d._y - NODE_H / 2})`);
    all.select("rect")
      .attr("fill", d => colorFor(d, d === selectedNode ? 1.0 : 0.13))
      .attr("stroke", d => colorFor(d, d === selectedNode ? 1.0 : 0.4))
      .attr("opacity", d => !searchTerm ? 1 : ((d.name.toLowerCase().includes(searchTerm) || (d.short || "").toLowerCase().includes(searchTerm)) ? 1 : 0.2));
    all.select(".nd-icon").text(d => d.icon || "•");
    all.select(".nd-name").text(d => d.name);
    all.select(".nd-done").style("display", d => done[d.id] ? null : "none");
    all.select(".nd-axes").each(function (d) {
      const sel = d3.select(this); sel.selectAll("*").remove();
      if (!d.tradeoffs?.length) return;
      const axes = d.tradeoffs.slice(0, 3);
      let lineIdx = 0;
      const line = (txt) => { sel.append("text").attr("x", 32).attr("y", 36 + lineIdx * 8).style("font-size", "6px").style("fill", "#cbd5e1").style("pointer-events", "none").text(txt); lineIdx += 1; };
      axes.forEach((axis, axisIdx) => {
        const leftLines = wrap(String(axis.left || "").split(":")[0], 60);
        const rightLines = wrap(String(axis.right || "").split(":")[0], 60);
        if (axisIdx > 0) lineIdx += 1;
        leftLines.forEach((l, i) => line(l + (i === leftLines.length - 1 ? " vs" : "")));
        rightLines.forEach(l => line(l));
        if (axisIdx < axes.length - 1) {
          const sepY = 36 + lineIdx * 8 - 4;
          sel.append("line").attr("x1", 12).attr("x2", NODE_W - 12).attr("y1", sepY).attr("y2", sepY).style("stroke", "#1e293b").style("stroke-width", 0.4);
        }
      });
    });
    all.select(".nd-expand-btn").text(d => d.children?.length ? (d._collapsed ? "▸" : "▾") : "")
      .on("click", (e, d) => { e.stopPropagation(); if (d.children?.length) { d._collapsed = !d._collapsed; render(); } });
    all.on("click", (_, d) => { if (d.children?.length) d._collapsed = !d._collapsed; select(d); });
    nodeGs.exit().remove();
  }

  // ── Selection + panel ──
  function select(node, { pan = false } = {}) {
    selectedNode = node;
    SD.store.prefs.set(K.node, node.id || "");
    showPanel(node);
    render();
    updateBreadcrumb(node);
    if (pan) panTo(node);
  }

  function showPanel(node) {
    const dp = document.getElementById("dp"), body = document.getElementById("dp-body");
    dp.classList.add("open");
    document.getElementById("dp-title").textContent = node.name;
    document.getElementById("dp-open-lesson").href = node.id === "root" ? "#/learn" : `#/lesson/${node.id}`;
    body.innerHTML = SD.lesson.render(node, { compact: true });
    body.scrollTop = 0;
    SD.lesson.wire(body, node, { onNavigate: id => { const t = SD.byId[id]; if (t) navigateTo(t); } });
  }

  function updateBreadcrumb(node) {
    const trail = []; let n = node;
    while (n) { trail.unshift(n.name); n = n._parent; }
    document.getElementById("breadcrumb").textContent = trail.join(" › ");
  }

  function navigateTo(node) {
    node._collapsed = false;
    let p = node._parent; while (p) { p._collapsed = false; p = p._parent; }
    render();
    select(node, { pan: true });
  }

  // ── View helpers ──
  function canvasSize() { const el = document.getElementById("canvas-wrap"); return { w: el.offsetWidth, h: el.offsetHeight }; }

  function fitView() {
    const nodes = layout(TREE); if (!nodes.length) return;
    const xs = nodes.map(n => n._x), ys = nodes.map(n => n._y);
    const minX = Math.min(...xs) - 20, maxX = Math.max(...xs) + NODE_W + 20, minY = Math.min(...ys) - NODE_H - 20, maxY = Math.max(...ys) + NODE_H + 20;
    const { w, h } = canvasSize(); if (!w || !h) return;
    const scale = Math.min(w / (maxX - minX), h / (maxY - minY), 1.5);
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(w / 2 - scale * (minX + maxX) / 2, h / 2 - scale * (minY + maxY) / 2).scale(scale));
  }

  function panTo(node, scale = 0.9) {
    const { w, h } = canvasSize();
    svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity.translate(w / 2 - scale * (node._x + NODE_W / 2), h / 2 - scale * node._y).scale(scale));
  }

  function saveExpanded() {
    if (!mounted) return;
    const ids = []; (function c(n) { if (n.id && n._depth >= 1 && !n._collapsed) ids.push(n.id); (n.children || []).forEach(c); })(TREE);
    SD.store.prefs.set(K.expanded, ids);
  }

  // ── Phase nav (left rail inside the map) ──
  function buildPhaseNav() {
    const nav = document.getElementById("phase-nav"); nav.innerHTML = "";
    TREE.children.forEach(phase => {
      const el = document.createElement("button"); el.type = "button"; el.className = "pn";
      el.innerHTML = `<span class="pn-dot" style="background:${SD.colorOf(phase)}"></span><span>${SD.fmt.esc(phase.name.replace(/^Phase \d+ · /, ""))}</span>`;
      el.onclick = () => { nav.querySelectorAll(".pn").forEach(x => x.classList.remove("active")); el.classList.add("active"); phase._collapsed = !phase._collapsed; select(phase, { pan: true }); };
      nav.appendChild(el);
    });
  }

  // ── Keyboard ──
  function onKey(e) {
    if (!visible || !selectedNode) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    const nodes = layout(TREE), idx = nodes.indexOf(selectedNode), kids = selectedNode.children?.length > 0;
    const act = {
      ArrowRight() { if (kids && selectedNode._collapsed) { selectedNode._collapsed = false; render(); } },
      ArrowLeft()  { if (kids && !selectedNode._collapsed) { selectedNode._collapsed = true; render(); } else if (selectedNode._parent) { select(selectedNode._parent); } },
      ArrowDown()  { if (idx < nodes.length - 1) select(nodes[idx + 1]); },
      ArrowUp()    { if (idx > 0) select(nodes[idx - 1]); },
    };
    if (act[e.key]) { e.preventDefault(); act[e.key](); }
  }

  // ── Panel resize / close ──
  function initPanel() {
    const dp = document.getElementById("dp"), handle = document.getElementById("dp-resize");
    let startX, startW, dragging = false;
    const clamp = w => Math.min(Math.max(w, 320), window.innerWidth - 60);
    handle.addEventListener("pointerdown", e => {
      e.preventDefault(); dragging = true; startX = e.clientX; startW = dp.offsetWidth; handle.classList.add("dragging");
      document.body.style.userSelect = "none";
      const move = ev => { if (dragging) dp.style.width = clamp(startW + (startX - ev.clientX)) + "px"; };
      const up = () => { dragging = false; handle.classList.remove("dragging"); document.body.style.userSelect = ""; SD.store.prefs.set(K.panelW, dp.style.width); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
      window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    }, { passive: false });
    document.getElementById("dp-close").onclick = () => { dp.classList.remove("open"); selectedNode = null; SD.store.prefs.set(K.node, ""); render(); };
    document.getElementById("dp-expand").onclick = () => { dp.style.width = (dp.offsetWidth < 900) ? "1000px" : "700px"; };
    const saved = SD.store.prefs.get(K.panelW, null); if (saved) dp.style.width = saved;
  }

  // ── Mount / show / hide ──
  function mount() {
    if (mounted) return;
    TREE = SD.TREE;
    svg = d3.select("#svg"); g = svg.append("g").attr("id", "tree-g");
    zoom = d3.zoom().scaleExtent([0.05, 2.5]).on("zoom", e => { g.attr("transform", e.transform); if (mounted) SD.store.prefs.set(K.zoom, { k: e.transform.k, x: e.transform.x, y: e.transform.y }); });
    svg.call(zoom).on("dblclick.zoom", null);

    const savedExpanded = SD.store.prefs.get(K.expanded, null);
    if (savedExpanded) { const set = new Set(savedExpanded); (function r(n) { if (n.id && n._depth >= 1) n._collapsed = !set.has(n.id); (n.children || []).forEach(r); })(TREE); }

    buildPhaseNav();
    initPanel();

    document.getElementById("zi").onclick = () => svg.transition().call(zoom.scaleBy, 1.4);
    document.getElementById("zo").onclick = () => svg.transition().call(zoom.scaleBy, 0.7);
    document.getElementById("fit").onclick = () => { fitView(); };
    document.getElementById("rst").onclick = () => { TREE.children.forEach(c => { c._collapsed = false; }); render(); fitView(); };
    document.getElementById("collapse").onclick = () => { (function c(n) { n._collapsed = n._depth >= 1; (n.children || []).forEach(c); })(TREE); render(); fitView(); };
    document.getElementById("sidebar-toggle").onclick = () => { document.getElementById("sidebar").classList.toggle("collapsed"); setTimeout(render, 250); };

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", () => { if (visible) render(); });
    SD.examples.onChange(() => { if (selectedNode && visible) showPanel(selectedNode); });
    window.addEventListener("sd:progress", () => { if (visible) render(); });

    mounted = true;
    render();
    const savedNode = SD.store.prefs.get(K.node, ""); const restored = savedNode ? SD.byId[savedNode] : null;
    if (restored) select(restored);
  }

  function show(nodeId) {
    visible = true;
    if (!mounted) mount();
    render();
    const savedZoom = SD.store.prefs.get(K.zoom, null);
    if (nodeId && SD.byId[nodeId]) { navigateTo(SD.byId[nodeId]); }
    else if (savedZoom) svg.call(zoom.transform, d3.zoomIdentity.translate(savedZoom.x, savedZoom.y).scale(savedZoom.k));
    else setTimeout(fitView, 60);
  }
  function hide() { visible = false; }
  function setSearch(term) { searchTerm = (term || "").toLowerCase().trim(); if (searchTerm) (function x(n) { n._collapsed = false; (n.children || []).forEach(x); })(TREE); if (mounted) render(); }

  SD.map = { mount, show, hide, setSearch, navigateTo: id => { const n = SD.byId[id]; if (n) navigateTo(n); } };
})();
