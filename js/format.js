// ══════════════════════════════════════════════════════════════
// FORMAT — turns the long prose in the data files into readable HTML.
//   • escapes HTML (data is trusted, but uploads are not)
//   • "(1) ... (2) ..." enumerations become ordered lists
//   • paragraphs over ~600 chars are split at sentence boundaries
//   • " -- " becomes an em dash, straight quotes get a little typography
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typo(s) {
    return String(s ?? "")
      .replace(/\s--\s/g, " — ")
      .replace(/\s->\s/g, " → ");
  }

  // Inline: escape + typography, no block structure.
  function inline(s) { return typo(esc(s)); }

  // Abbreviations after which a period does not end a sentence.
  const ABBR = /(?:\b(?:vs|e\.g|i\.e|etc|approx|no|st|mr|mrs|dr|fig|p|vol|incl)|\b[A-Z]|\d)\.$/i;

  function sentences(text) {
    const out = [];
    let buf = "";
    const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/);
    parts.forEach(p => {
      if (buf && ABBR.test(buf.trim())) { buf += " " + p; return; }
      if (buf) out.push(buf);
      buf = p;
    });
    if (buf) out.push(buf);
    return out;
  }

  // Group sentences into paragraphs of roughly `target` characters.
  function paragraphs(text, target = 420) {
    const ss = sentences(text);
    const paras = [];
    let cur = "";
    ss.forEach(s => {
      if (cur && (cur.length + s.length) > target && cur.length > 180) { paras.push(cur); cur = s; }
      else cur = cur ? cur + " " + s : s;
    });
    if (cur) paras.push(cur);
    return paras;
  }

  // Detect "(1) ... (2) ..." enumerations and render as a list.
  function enumeration(text) {
    const idx = [];
    const re = /\((\d{1,2})\)\s/g;
    let m, expected = 1;
    while ((m = re.exec(text))) {
      if (parseInt(m[1], 10) === expected) { idx.push(m.index); expected++; }
    }
    if (idx.length < 2) return null;
    const intro = text.slice(0, idx[0]).trim();
    const items = [];
    for (let i = 0; i < idx.length; i++) {
      const start = idx[i], end = i + 1 < idx.length ? idx[i + 1] : text.length;
      items.push(text.slice(start, end).replace(/^\(\d{1,2}\)\s*/, "").trim());
    }
    // If the final item carries a long trailing coda (another couple of
    // sentences after the list), split it off as a closing paragraph.
    let coda = "";
    const last = items[items.length - 1];
    const lastSentences = sentences(last);
    if (lastSentences.length > 3) {
      items[items.length - 1] = lastSentences.slice(0, 2).join(" ");
      coda = lastSentences.slice(2).join(" ");
    }
    return { intro, items, coda };
  }

  function prose(text, opts = {}) {
    if (!text) return "";
    const t = typo(esc(text));
    const en = enumeration(t);
    if (en) {
      const intro = en.intro ? paragraphs(en.intro).map(p => `<p>${p}</p>`).join("") : "";
      const list  = `<ol class="prose-list">${en.items.map(i => `<li>${i}</li>`).join("")}</ol>`;
      const coda  = en.coda ? paragraphs(en.coda).map(p => `<p>${p}</p>`).join("") : "";
      return intro + list + coda;
    }
    if (opts.single) return `<p>${t}</p>`;
    return paragraphs(t).map(p => `<p>${p}</p>`).join("");
  }

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  function minutes(words) { return Math.max(1, Math.round(words / 220)); }

  function wordCount(node) {
    let n = 0;
    const add = s => { if (typeof s === "string") n += s.split(/\s+/).length; };
    const walk = v => {
      if (!v || typeof v !== "object") return add(v);
      if (Array.isArray(v)) return v.forEach(walk);
      Object.entries(v).forEach(([k, x]) => { if (!k.startsWith("_") && k !== "children") walk(x); });
    };
    walk(node);
    return n;
  }

  SD.fmt = { esc, inline, prose, slug, minutes, wordCount, sentences };
})();
