# System Design Decision Tree

Interactive system design decision tree split into modular phase data files.

## Project Structure

- `index.html` — app shell and script loading order
- `styles.css` — UI styling
- `app.js` — tree assembly and D3 rendering logic
- `data/phase-*.js` — individual phase definitions

## Run Locally

### Option 1: Open directly
Open `index.html` in a browser.

### Option 2: Run a local static server (recommended)
From the project root:

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000`

## Notes

- Internet access is required for the D3 CDN script in `index.html`.
- Phase files must load before `app.js` (already configured in `index.html`).
