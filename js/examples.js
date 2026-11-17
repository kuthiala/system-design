// ══════════════════════════════════════════════════════════════
// EXAMPLES — the "applied to a real system" overlay.
// Example plugins push into window.EXAMPLES (see examples/README.md).
// This module owns the selector in the top bar, runtime upload, the
// overview card, and the architecture diagram modal (Mermaid).
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const listeners = [];
  const state = { active: null };

  function list() { return window.EXAMPLES || []; }
  function onChange(cb) { listeners.push(cb); }
  function emit() { listeners.forEach(cb => { try { cb(state.active); } catch (e) { console.error(e); } }); }

  function select(id, { persist = true } = {}) {
    state.active = list().find(e => e.id === id) || null;
    if (persist) SD.store.prefs.set("example", state.active ? id : "");
    syncUI();
    emit();
  }

  function syncUI() {
    const sel = document.getElementById("example-select");
    const btn = document.getElementById("example-diagram-btn");
    const ov  = document.getElementById("example-overview");
    if (sel && sel.value !== (state.active?.id || "")) sel.value = state.active?.id || "";
    if (btn) btn.style.display = state.active?.diagram ? "" : "none";
    if (ov) {
      if (!state.active) { ov.innerHTML = ""; ov.classList.remove("active"); }
      else {
        ov.classList.add("active");
        ov.innerHTML = `<div class="ex-tagline">${SD.fmt.inline(state.active.tagline || "")}</div><div class="ex-overview-text">${SD.fmt.inline(state.active.overview || "")}</div>`;
      }
    }
    document.body.classList.toggle("has-example", !!state.active);
  }

  function addOption(sel, ex) {
    const opt = document.createElement("option");
    opt.value = ex.id; opt.textContent = `${ex.icon || "📦"} ${ex.name}`;
    sel.appendChild(opt);
  }

  function mount() {
    const sel = document.getElementById("example-select");
    if (!sel) return;
    list().forEach(ex => addOption(sel, ex));
    sel.onchange = () => select(sel.value);

    // Runtime upload of a plugin file (evaluated in-page: only load files you trust)
    const upload = document.getElementById("example-upload");
    const err = document.getElementById("example-upload-error");
    if (upload) {
      upload.onchange = function () {
        const file = this.files[0];
        if (!file) return;
        if (err) err.textContent = "";
        const reader = new FileReader();
        reader.onload = e => {
          const before = list().length;
          try { new Function("window", e.target.result)(window); }
          catch (ex) { if (err) err.textContent = "Error loading example: " + ex.message; return; }
          const added = list().slice(before);
          if (!added.length) { if (err) err.textContent = "No example found. The file must push into window.EXAMPLES."; return; }
          added.forEach(ex => addOption(sel, ex));
          select(added[0].id);
        };
        reader.readAsText(file);
        this.value = "";
      };
    }

    // Restore
    const saved = SD.store.prefs.get("example", "");
    if (saved) select(saved, { persist: false }); else syncUI();

    initDiagramModal();
  }

  // ── Architecture diagram modal ──
  function initDiagramModal() {
    const btn = document.getElementById("example-diagram-btn");
    const modal = document.getElementById("diagram-modal");
    const closeBtn = document.getElementById("diagram-modal-close");
    const title = document.getElementById("diagram-modal-title");
    const body = document.getElementById("diagram-modal-body");
    if (!btn || !modal || !closeBtn || !body) return;

    let dZoom = null, dSvg = null, dG = null, lastRef = null;

    function fit() {
      if (!dSvg || !dG || !dZoom) return;
      const vb = dSvg.node()?.viewBox?.baseVal;
      if (!vb?.width || !vb?.height) return;
      const r = body.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pad = 32, scale = Math.min((r.width - pad) / vb.width, (r.height - pad) / vb.height);
      dSvg.call(dZoom.transform, d3.zoomIdentity.translate(r.width / 2 - scale * (vb.x + vb.width / 2), r.height / 2 - scale * (vb.y + vb.height / 2)).scale(scale));
    }
    document.getElementById("diagram-zi").onclick = () => dSvg && dSvg.transition().call(dZoom.scaleBy, 1.4);
    document.getElementById("diagram-zo").onclick = () => dSvg && dSvg.transition().call(dZoom.scaleBy, 0.7);
    document.getElementById("diagram-fit").onclick = fit;

    async function open() {
      const ex = state.active;
      if (!ex?.diagram) return;
      title.textContent = `${ex.icon || "📦"} ${ex.name} — Architecture`;
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      if (lastRef === ex) return;
      lastRef = ex;
      body.innerHTML = "<div class='muted' style='padding:24px'>Rendering diagram…</div>";
      dSvg = dG = dZoom = null;
      try {
        const svgEl = await SD.mermaidRender(body, ex.diagram);
        svgEl.removeAttribute("width"); svgEl.removeAttribute("height");
        svgEl.style.cssText = "width:100%;height:100%;display:block";
        const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        Array.from(svgEl.childNodes).forEach(c => wrapper.appendChild(c));
        svgEl.appendChild(wrapper);
        dSvg = d3.select(svgEl); dG = d3.select(wrapper);
        dZoom = d3.zoom().scaleExtent([0.08, 8]).on("zoom", e => dG.attr("transform", e.transform));
        dSvg.call(dZoom).on("dblclick.zoom", null);
        setTimeout(fit, 100);
      } catch (e) {
        body.innerHTML = `<div class="error" style="padding:20px">Failed to render: ${SD.fmt.esc(e.message)}</div>`;
      }
    }
    function close() { modal.classList.remove("open"); document.body.style.overflow = ""; }
    btn.onclick = open; closeBtn.onclick = close;
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
  }

  // Shared Mermaid helper (also used by Practice problems)
  let mermaidReady = false;
  SD.mermaidRender = async function (container, src) {
    if (!window.mermaid) throw new Error("Mermaid not loaded (needs network for the CDN script)");
    if (!mermaidReady) { mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" }); mermaidReady = true; }
    const id = "mmd-" + Math.random().toString(36).slice(2);
    const { svg } = await mermaid.render(id, src.trim());
    container.innerHTML = svg;
    const el = container.querySelector("svg");
    if (!el) throw new Error("No SVG in output");
    return el;
  };

  SD.examples = { get active() { return state.active; }, list, select, onChange, mount };
})();
