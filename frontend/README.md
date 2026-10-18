# LeadsTrellis AI — frontend

React 19 + Vite + TypeScript + Tailwind CSS v4. Data currently comes from mock fetchers.

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # production build into dist/
```

## Structure

| Folder | Holds |
|---|---|
| `src/styles/tokens/` | Colours, M3 type roles (`text-body-medium`, …), radii, motion: all Tailwind `@theme` tokens |
| `src/components/ui/` | Primitives: Card, Button, PillSelect, Tabs, ProgressRing, StatStrip, Badge, Switch… |
| `src/components/charts/` | BarChart, Sparkline, FunnelBars, ChartTooltip (SVG/HTML, with hover tooltips) |
| `src/components/layout/` | App frame, Sidebar, Topbar, BrandLogo, UserMenu, MobileDrawer |
| `src/features/<name>/` | `api/` (data access), `hooks/` (TanStack Query), `components/`, `types.ts` |
| `src/mocks/` | UAE demo data |
| `src/pages/` | Thin pages that compose feature components |

## Connecting the backend

Each function in `features/dashboard/api/dashboard.api.ts` names the endpoint it stands in for.
Replace `mockRequest(...)` with a real HTTP call; hooks and components need no changes.
