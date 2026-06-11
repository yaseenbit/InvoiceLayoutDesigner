---
name: project-invoice-designer
description: Invoice Layout Designer — React+TS+Tailwind A4 invoice designer project context
metadata:
  type: project
---

Production-grade A4 invoice layout designer built at `/Users/yaseen/personal/InvoiceLayoutDesigner`.

**Why:** Foundation for a real billing/invoicing system where users design their own A4 invoice templates.

**Stack:** React 18, TypeScript strict, Tailwind CSS, Vite, uuid, localStorage persistence.

**Architecture:**
- `src/designer/types/` — strongly-typed template model (`InvoiceTemplate`, `InvoiceElement` union, etc.)
- `src/designer/context/DesignerContext.tsx` — central Context+Reducer, undo/redo history stack (max 60 steps)
- `src/designer/hooks/` — `useElementDrag`, `useElementResize` (direct DOM manipulation during interaction, commit to state on mouseup), `useKeyboardShortcuts`, `useClipboard`
- `src/designer/elements/` — per-type renderers (Text, Field, Line, Box, Image, ItemsTable, TaxSummaryTable, TotalsBox, etc.)
- `src/designer/components/` — DesignerLayout, CanvasWorkspace (hosts drag+resize hooks), A4Canvas, ToolboxPanel, PropertiesPanel, Ruler, GridOverlay, ResizeHandles, StatusBar, TopToolbar
- `src/designer/services/` — LocalStorageTemplateRepository, TemplateValidator, InvoiceDataResolver (sample data), PrintService

**Key design decisions:**
- Drag performance: `useElementDrag`/`useElementResize` use `requestAnimationFrame` + direct DOM style updates during drag; React state only on mouseup
- `startResize` must come from the single `useElementResize` instance in `CanvasWorkspace` — do NOT instantiate it in `ElementRenderer` (causes split-instance bug)
- Drop coordinates use `rect.width / 210` to handle zoom-scaled canvas correctly
- All positions stored as mm; zoom applied via `transform: scale(zoom)` on canvas wrapper
- Print: CSS `@media print` hides UI, shows `#invoice-print-root` at real mm dimensions

**How to apply:** When extending this project, follow the existing patterns — new element types need entries in `elementFactory.ts`, a renderer in `elements/`, and a case in `ElementRenderer.tsx` switch.
