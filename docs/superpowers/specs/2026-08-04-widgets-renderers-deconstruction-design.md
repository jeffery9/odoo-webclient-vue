# 🌌 Specification: Modular Deconstruction of Widgets & Renderers Layer

**Date**: 2026-08-04  
**Author**: Gemini CLI & Odoo Architecture Sentry  
**Status**: APPROVED  
**Core Paradigm**: Modularity & Single-Responsibility Principle (物理级模块化拆解)

---

## 1. Executive Summary & Design Vision

As our Odoo Vue Client SDK grows, monolithic files like `packages/vue-runtime/src/widgets.ts` (containing all input/relational widgets) and `packages/vue-runtime/src/renderers.ts` (containing all view renders and custom layouts) become significant bottlenecks for maintenance, testing, and team execution.

To satisfy the **Faster, Smaller, and Cleanly Isolated** design standard, we enforce a physical modular deconstruction of both files:
*   **Encapsulated Fields**: Every heavy or relational Odoo widget (Html, Many2one, One2many, Many2many) gets its own dedicated single-responsibility file.
*   **Decoupled View Renderers**: High-concurrency or specialized view engines (Form, List, Graph, Pivot, Gantt) are extracted into independent modules.
*   **Pristine Upstream API Parity**: Directory-level index exports (`index.ts`) gather and re-export all components, ensuring 100% backward-compatibility. Outside application layers and test suites import components seamlessly without any syntax alterations.

---

## 2. Directory Layout & Relocation Blueprint

We reorganize `packages/vue-runtime/src/` into two dedicated folders: `widgets/` and `renderers/`.

### 2.1 Widgets Folder Layout (`src/widgets/`)
All widgets are separated and relocated into the following sub-files:

| Relocated Component | Destination File | Responsibility |
|---------------------|------------------|----------------|
| `FieldChar` | `src/widgets/FieldChar.ts` | Base single-line character inputs. |
| `FieldText` | `src/widgets/FieldText.ts` | Multi-line text inputs. |
| `FieldHtml` | `src/widgets/FieldHtml.ts` | Advanced template WYSIWYG QWeb editor with Live Preview. |
| `FieldInteger`, `FieldFloat`, `FieldMonetary`, `FieldPercentage` | `src/widgets/numeric.ts` | Numeric and monetary Odoo widgets. |
| `FieldBoolean` | `src/widgets/FieldBoolean.ts` | Standard interactive toggle checkboxes. |
| `FieldSelection` | `src/widgets/FieldSelection.ts` | Relational selection option dropdowns. |
| `FieldDate`, `FieldDatetime` | `src/widgets/datetime.ts` | Date and Datetime pickers. |
| `FieldMany2one` | `src/widgets/FieldMany2one.ts` | Autocomplete relational search dropdowns. |
| `FieldOne2many` | `src/widgets/FieldOne2many.ts` | Relational embedded child list tables. |
| `FieldMany2many` | `src/widgets/FieldMany2many.ts` | Relational tags selection lists. |
| `FieldStatusbar` | `src/widgets/FieldStatusbar.ts` | Standard header statusbar and stages widget. |
| `FieldBadge`, `FieldProgressBar`, `FieldPriority`, `FieldImage`, `FieldHandle`, `FieldTag`, `FieldAvatar` | `src/widgets/widgets.ts` | Legacy, helper, and lightweight status/image widgets. |

All widgets are gathered and re-exported in `packages/vue-runtime/src/widgets/index.ts`:
```typescript
export * from './FieldChar.js';
export * from './FieldText.js';
export * from './FieldHtml.js';
export * from './numeric.js';
export * from './FieldBoolean.js';
export * from './FieldSelection.js';
export * from './datetime.js';
export * from './FieldMany2one.js';
export * from './FieldOne2many.js';
export * from './FieldMany2many.js';
export * from './FieldStatusbar.js';
export * from './widgets.js';
```

---

### 2.2 Renderers Folder Layout (`src/renderers/`)
All layout and view rendering engines are separated and relocated into the following sub-files:

| Relocated Component | Destination File | Responsibility |
|---------------------|------------------|----------------|
| `FormRenderer` | `src/renderers/FormRenderer.ts` | Master Odoo Form View renderer. |
| `ListRenderer` | `src/renderers/ListRenderer.ts` | Master Odoo List/Tree Grid View renderer. |
| `CardRenderer` | `src/renderers/CardRenderer.ts` | Card/Kanban-like helper view renderer. |
| `QWebRenderer` | `src/renderers/QWebRenderer.ts` | Raw QWeb template layouts renderer. |
| `OdooNotebook` | `src/renderers/OdooNotebook.ts` | Stateful layout Tab pages and notebooks. |
| `GraphRenderer` | `src/renderers/complex/GraphRenderer.ts` | Analytical multi-dimensional Graph charts. |
| `PivotRenderer` | `src/renderers/complex/PivotRenderer.ts` | Analytical Pivot grid tables. |
| `CalendarRenderer` | `src/renderers/complex/CalendarRenderer.ts` | Stateful scheduling Calendar calendar views. |
| `ActivityRenderer` | `src/renderers/complex/ActivityRenderer.ts` | CRM Mail/Activity logs schedule views. |
| `GanttRenderer` | `src/renderers/complex/GanttRenderer.ts` | Enterprise timeline and schedules Gantt chart. |

All renderers are gathered and re-exported in `packages/vue-runtime/src/renderers/index.ts`:
```typescript
export * from './FormRenderer.js';
export * from './ListRenderer.js';
export * from './CardRenderer.js';
export * from './QWebRenderer.js';
export * from './OdooNotebook.js';
export * from './complex/GraphRenderer.js';
export * from './complex/PivotRenderer.js';
export * from './complex/CalendarRenderer.js';
export * from './complex/ActivityRenderer.js';
export * from './complex/GanttRenderer.js';
```

---

## 3. High-Level entrypoint (`packages/vue-runtime/src/index.ts`)

The master entry-point is updated to re-export both directories seamlessly:
```typescript
export * from './di.js';
export * from './registry.js';
export * from './composables/useOdooField.js';
export * from './composables/useOdooRelationField.js';
export * from './widgets/index.js';
export * from './renderers/index.js';
```

Old files `/Users/jeffery/odoo-client-sdk/packages/vue-runtime/src/widgets.ts` and `/Users/jeffery/odoo-client-sdk/packages/vue-runtime/src/renderers.ts` are safely deleted.

---

## 4. Architectural Quality Gates & Testing Verification

1.  **Zero-Regression Verification**:
    *   No production logic is changed. 
    *   Run the workspace test suite (`npm run test`) to verify all 33+ high-fidelity tests inside `@odoo/vue-runtime` and `@odoo/sdk` pass 100%.
2.  **Web Client Parity**:
    *   Run static building (`npm run build`) across the workspaces to verify that typescript compilation succeeds cleanly.
