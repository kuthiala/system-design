# Example Plugins

Each example is a self-contained plugin that maps a real-world system design onto every relevant phase/node in the framework. The user can toggle an example on; the detail panel for any node then shows an "Applied to: <example>" section with example-specific guidance.

## Adding a new example

1. Create `examples/<your-example>.js`
2. Define a global object (e.g. `EXAMPLE_MY_SYSTEM`) with the schema below.
3. Add a `<script>` tag in `index.html` after the phase data files.
4. Register in `examples/_registry.js` by pushing into `EXAMPLES`.

## Schema

```js
const EXAMPLE_FOO = {
  id: "foo",                    // unique slug
  name: "My System",            // human label shown in UI
  icon: "🛰️",
  tagline: "One-line summary",
  overview: "Multi-paragraph description of the system being designed.",
  // Map of nodeId -> { decision, why, notes? }
  nodes: {
    "req-traffic": {
      decision: "Concrete decision for this node in this example",
      why: "Why this fits the example's constraints",
      notes: "Optional extra detail / numbers"
    },
    "db-primary": { ... },
    // ... cover as many phases as relevant
  }
};
```

`app.js` automatically picks up entries from `EXAMPLES` and renders them under each matching node in the detail panel.
