// ══════════════════════════════════════════════════════════════
// MAIN — boot + hash router.
//   #/learn  #/lesson/:id  #/map[/:id]  #/practice[/:id]
//   #/reference[/:tab]  #/drill
// ══════════════════════════════════════════════════════════════

window.SD = window.SD || {};

(function () {
  const view = () => document.getElementById("view");

  function route() {
    const [name = "learn", arg = ""] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const isMap = name === "map";
    document.body.classList.toggle("on-map", isMap);
    document.querySelectorAll("#topnav a[data-view]").forEach(a =>
      a.classList.toggle("on", a.dataset.view === (name === "lesson" ? "learn" : name)));
    if (isMap) { SD.map.show(arg); return; }
    SD.map.hide();
    const el = view();
    switch (name) {
      case "lesson":    SD.views.lesson(el, arg); break;
      case "practice":  arg ? SD.views.practice(el, arg) : SD.views.practiceList(el); break;
      case "reference": SD.views.reference(el, arg); break;
      case "drill":     SD.views.drill(el); break;
      default:          SD.views.learn(el);
    }
    updateDue();
  }

  function updateDue() {
    const b = document.getElementById("due-badge");
    if (!b) return;
    const n = SD.drill.due().length;
    b.textContent = n || ""; b.style.display = n ? "" : "none";
  }

  async function boot() {
    try { await SD.data.load(); }
    catch (e) {
      view().innerHTML = `<div class="page"><h1>Could not load data</h1><p>${SD.fmt.esc(e.message)}</p>
        <p class="ls-hint">Serve the folder over HTTP (for example <code>python3 -m http.server 8000</code>); browsers block fetch() from file:// URLs.</p></div>`;
      return;
    }
    SD.examples.mount();
    // Re-render the current non-map view when the overlay changes so the "Applied to" section updates.
    SD.examples.onChange(() => { if (!document.body.classList.contains("on-map")) route(); });
    const search = document.getElementById("search");
    search.oninput = () => SD.map.setSearch(search.value);
    window.addEventListener("hashchange", route);
    window.addEventListener("sd:progress", updateDue);
    window.addEventListener("sd:drill", updateDue);
    route();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
