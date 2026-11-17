// ══════════════════════════════════════════════════════════════
// DATA — loads every JSON file under data/ and builds the
// in-memory model used by all views.
//
//   SD.TREE        root node with phases as children (for the Map)
//   SD.phases      phase nodes in curriculum order
//   SD.nodes       every node (phase + child) in reading order
//   SD.byId        id -> node
//   SD.curriculum  arcs, study plan
//   SD.reference   { numbers, playbook, blocks }
//   SD.practice    problems in difficulty order
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
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

  async function fetchJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.json();
  }

  async function load() {
    const index = await fetchJSON("./data/index.json");

    const [phaseFiles, curriculum, refs, practiceIndex] = await Promise.all([
      Promise.all(index.phases.map(f => fetchJSON(`./data/${f}`))),
      fetchJSON(`./data/${index.curriculum}`),
      Promise.all(index.reference.map(f => fetchJSON(`./data/${f}`))),
      fetchJSON(`./data/${index.practice}`),
    ]);
    const practiceFiles = await Promise.all(practiceIndex.files.map(f => fetchJSON(`./data/practice/${f}`)));

    // ── Phases in curriculum order (fall back to file order for any not listed) ──
    const byPhaseId = {};
    phaseFiles.forEach(p => { byPhaseId[p.id] = p; });
    const ordered = [];
    curriculum.arcs.forEach(arc => arc.phases.forEach(id => { if (byPhaseId[id]) ordered.push(byPhaseId[id]); }));
    phaseFiles.forEach(p => { if (!ordered.includes(p)) ordered.push(p); });

    const TREE = {
      name: "System Design Framework", id: "root", icon: "⚙️", phase: "root",
      short: "End-to-end decisions for any scale",
      tldr: "A systematic decision framework that adapts every architectural concept to your company's actual scale. Start at Phase 1 and follow the branches that match your requirements.",
      detail: {
        what: "A systematic decision framework that adapts every architectural concept to your company's actual scale. Start at Phase 1 and follow the branches that match your requirements.",
        why: "Wrong architecture for your scale wastes money (over-engineered) or causes outages (under-engineered). This tree gives you the right answer at each scale.",
        numbers: "Thresholds: Small <1K RPS, Medium 1K to 50K RPS, Large 50K to 500K RPS, Hyper >500K RPS"
      },
      tradeoffs: [
        { axis: "Over-engineering vs Under-engineering", left: "Too simple: outages", right: "Too complex: slow velocity", pos: 0.5 },
        { axis: "Build vs Buy", left: "Custom: control", right: "Managed: speed", pos: 0.5 }
      ],
      levelUp: [],
      children: ordered
    };

    // ── Annotate tree, flatten ──
    const nodes = [], byId = {};
    (function walk(node, parent, depth) {
      node._parent = parent; node._depth = depth;
      node._collapsed = depth >= 1;
      node._id = node.id || Math.random().toString(36).slice(2);
      if (node.id !== "root") { nodes.push(node); byId[node.id] = node; }
      (node.children || []).forEach(c => walk(c, node, depth + 1));
    })(TREE, null, 0);
    TREE._collapsed = false;

    // ── Arc lookup ──
    const arcOfPhase = {};
    curriculum.arcs.forEach(arc => arc.phases.forEach(pid => { arcOfPhase[pid] = arc; }));

    // ── Reference ──
    const reference = {};
    refs.forEach(r => { reference[r.id] = r; });

    // ── Practice ──
    const rank = { "warm-up": 0, core: 1, staff: 2 };
    const practice = practiceFiles.flat().sort((a, b) => (rank[a.difficulty] ?? 9) - (rank[b.difficulty] ?? 9));

    Object.assign(SD, {
      PHASE_COLORS, TREE, phases: ordered, nodes, byId, curriculum, reference, practice,
      phaseOf(node) { let n = node; while (n && n._depth > 1) n = n._parent; return n; },
      arcOf(node)   { const ph = this.phaseOf(node); return ph ? arcOfPhase[ph.id] : null; },
      indexOf(id)   { return nodes.findIndex(n => n.id === id); },
      next(id)      { const i = this.indexOf(id); return i >= 0 && i < nodes.length - 1 ? nodes[i + 1] : null; },
      prev(id)      { const i = this.indexOf(id); return i > 0 ? nodes[i - 1] : null; },
      colorOf(node) { return PHASE_COLORS[node.phase] || "#475569"; },
      arcIndex(arc) { return curriculum.arcs.indexOf(arc); },
      lessonsInArc(arc) { return arc.phases.flatMap(pid => { const p = byId[pid]; return p ? [p, ...(p.children || [])] : []; }); },
    });
    return SD;
  }

  SD.data = { load };
})();
