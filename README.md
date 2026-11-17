# System Design Decision Tree

Interactive system design decision tree split into modular phase data files.

## Project Structure

- `index.html` — app shell (top nav, page view, map) and script loading order
- `styles.css` — map/sidebar styling; `css/views.css` — Learn/Practice/Reference/Drill pages
- `js/` — modules on `window.SD`: `store`, `format`, `data` (loads JSON), `examples`, `lesson`, `drill` (spaced repetition), `map` (D3 tree), `views*` (pages), `main` (boot + hash router)
- `data/index.json` — manifest: phases, `curriculum.json`, `reference/*.json`, `practice/index.json`
- `data/phase-*.json` — phase and lesson content (`tldr`, `keyInsight`, `mentalModel`, `interview`, `quiz`, ...)
- `app.js` — legacy single-file app, no longer loaded

Routes: `#/learn`, `#/lesson/:id`, `#/map[/:id]`, `#/practice[/:id]`, `#/reference/(numbers|playbook|blocks)`, `#/drill`.

## Run Locally

Data is loaded with `fetch()`, so the app must be served over HTTP (opening `index.html` from `file://` will not work).
From the project root:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

## Notes

- Internet access is required for the D3 CDN script in `index.html`.
- Phase files must load before `app.js` (already configured in `index.html`).
