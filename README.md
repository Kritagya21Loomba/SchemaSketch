# SchemaSketch

**Turn raw database schemas into bold, editorial ER diagrams in seconds.**

SchemaSketch is a zero-friction, fully client-side web app that transforms SQL DDL or JSON schemas into visually distinctive entity-relationship diagrams. No sign-ups, no backends, no clutter — paste your schema, watch it sketch itself.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Dual input modes** — Paste PostgreSQL-style SQL DDL or a JSON schema and get an instant ER diagram
- **Live preview** — Diagram updates as you type with 300ms debounced parsing
- **Hand-rolled SQL parser** — Recursive-descent parser handling `CREATE TABLE`, `ALTER TABLE ADD FOREIGN KEY`, inline and table-level constraints, composite primary keys, and graceful error recovery
- **Editorial visual style** — Dark cinematic aesthetic with film grain texture, neon accent colors, bold uppercase table headers, and JetBrains Mono columns
- **Interactive diagrams** — Drag tables to reposition, zoom with mouse wheel, pan by dragging the background
- **Hover highlighting** — Hover a table to see its connections glow, dimming unrelated edges
- **PNG export** — One-click export at 2x resolution for retina-quality diagrams
- **3 built-in presets** — Ecommerce (6 tables), Blog (5 tables), F1 Telemetry (6 tables) in both SQL and JSON
- **Syntax highlighting** — CodeMirror 6 editor with SQL and JSON language support and a custom dark theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Editor | CodeMirror 6 (SQL + JSON) |
| Rendering | SVG (no D3 — React maps directly to SVG elements) |
| Export | html-to-image |
| Deployment | Cloudflare Pages |

## Architecture

```
src/
├── types/schema.ts           # Core types: Schema, Table, Column, ForeignKey, ParseResult
├── parser/
│   ├── json-parser.ts        # JSON → Schema (3 FK formats supported)
│   └── sql/
│       ├── types.ts           # Token types
│       ├── tokenizer.ts       # Hand-rolled lexer with line/col tracking
│       └── parser.ts          # Recursive-descent DDL parser with error recovery
├── layout/
│   ├── grid-layout.ts        # Degree-based spiral grid placement
│   └── edge-routing.ts       # Angle-based connection point selection
├── renderer/
│   ├── DiagramCanvas.tsx     # Top-level SVG with pan/zoom, hover state
│   ├── TableNode.tsx         # Table card: header, divider, columns
│   ├── RelationshipEdge.tsx  # FK edge with arrowhead and accent color
│   └── Defs.tsx              # SVG filters: grain, glow, arrowheads
├── editor/
│   ├── SchemaEditor.tsx      # CodeMirror 6 wrapper
│   └── useCodeMirror.ts      # Hook with language Compartment switching
├── hooks/
│   ├── useSchema.ts          # Text → debounced parse → Schema
│   ├── useLayout.ts          # Schema → memoized layout
│   ├── usePanZoom.ts         # Wheel zoom + drag pan via SVG viewBox
│   └── useDragTable.ts       # Pointer events for table repositioning
└── presets/                   # 3 schemas in SQL + JSON format
```

### Key Design Decisions

- **No D3** — React's declarative model maps naturally to SVG; imperative DOM manipulation would conflict with reconciliation
- **Hand-rolled SQL parser** — Only a tiny DDL subset is needed; a full SQL parser would be 10x the bundle size for 1% of the features
- **Layout as a pure function** — `useLayout` is memoized derived data; drag overrides are stored separately and cleared on schema change
- **SVG viewBox for pan/zoom** — Native viewport control keeps coordinates in SVG-space, simplifying hit-testing, drag math, and export

## SQL Support

The parser handles PostgreSQL-style DDL:

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamp NOT NULL
);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  status varchar(50) NOT NULL,
  total decimal(10,2) NOT NULL
);

-- Also supported:
-- ALTER TABLE ... ADD FOREIGN KEY ...
-- IF NOT EXISTS
-- CONSTRAINT names
-- Composite PRIMARY KEY (col1, col2)
-- ON DELETE CASCADE / SET NULL / RESTRICT / NO ACTION
-- Line comments and block comments
```

## JSON Schema Format

```json
{
  "tables": [
    {
      "name": "users",
      "columns": [
        { "name": "id", "type": "uuid", "primaryKey": true },
        { "name": "email", "type": "varchar(255)", "unique": true }
      ],
      "foreignKeys": [
        { "column": "team_id", "references": { "table": "teams", "column": "id" } }
      ]
    }
  ]
}
```

Three FK formats are accepted:
- **Table-level**: `{ "column": "col", "references": { "table": "t", "column": "c" } }`
- **Dot-notation**: `{ "from": "orders.user_id", "to": "users.id" }` (top-level `foreignKeys` array)
- **Explicit**: `{ "fromTable": "orders", "fromColumn": "user_id", "toTable": "users", "toColumn": "id" }`

## Getting Started

```bash
# Clone
git clone https://github.com/Kritagya21Loomba/SchemaSketch.git
cd SchemaSketch

# Install
npm install

# Dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the app loads with a preset schema and diagram ready to explore.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npx tsc --noEmit` | Type-check only |

## Visual Style

- **Background**: `#0e0e11` with SVG grain texture (feTurbulence filter)
- **Table cards**: `#1a1a1f` with `#2a2a32` borders, 8px radius, drop shadows
- **Text**: `#e8e8ec` headers (Inter 800, uppercase), `#b0b0b8` columns (JetBrains Mono)
- **Accents**: PK `#ffcc00`, edges cycle through `#00e5ff` / `#ff0080` / `#7c4dff` / `#00e676` / `#ffab00`
- **Hover**: Cyan glow on focused table, connected edges brighten, others dim

## License

MIT
