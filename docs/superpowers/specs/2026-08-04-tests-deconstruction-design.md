# 🌌 Specification: Modular Deconstruction & Relocation of Test Suites

**Date**: 2026-08-04  
**Author**: Gemini CLI & Odoo QA Sentry  
**Status**: APPROVED  
**Core Paradigm**: Separation of Tests (测试套件同级剥离) & 1:1 Mirror Mapping

---

## 1. Executive Summary & Design Vision

To ensure maximum structural purity, keep our runtime package zero-overhead, and strictly adhere to **Section 3.C: Separation of Tests** in our repository's `GEMINI.md` protocol, we deconstruct and relocate all monolithic test files currently residing inside `packages/vue-runtime/src/`:
*   **Complete Physical Separation**: No tests should be co-located with production source code under `src/`. All test suites are moved to a dedicated sibling folder `packages/vue-runtime/tests/`.
*   **Atomic 1:1 Mirror Mapping**: Giant test suites (`widgets.test.ts` and `renderers.test.ts`) are split into small, focused, and dedicated files that mirror the modular production file layout 1:1.
*   **Zero-Regression Verification**: This refactoring changes only file physical layout and imports; zero behavioral assertion is modified.

---

## 2. Directory Layout & Relocation Blueprint

We reorganize `packages/vue-runtime/tests/` into sub-folders matching `src/`.

### 2.1 Widgets Tests Relocation (`tests/widgets/`)
Tests from the old monolithic `src/widgets.test.ts` are split and relocated into the following files:

| Target Component | Test Destination File | Focus of Assertions |
|------------------|-----------------------|---------------------|
| `FieldChar` | `tests/widgets/FieldChar.test.ts` | Edit mode input typing, readonly mode span rendering, invisible mode null output. |
| `FieldText` | `tests/widgets/FieldText.ts` (renamed `FieldText.test.ts`) | Textarea element rendering and typing. |
| `FieldHtml` | `tests/widgets/FieldHtml.test.ts` | WYSIWYG QWeb editor tabs, dynamic placeholder select, live variable compiled preview. |
| `numeric` widgets | `tests/widgets/numeric.test.ts` | Integer/Float number inputs, monetary currency renders, percentage scale multipliers. |
| `FieldBoolean` | `tests/widgets/FieldBoolean.test.ts` | Checkbox state rendering and toggles. |
| `FieldSelection` | `tests/widgets/FieldSelection.test.ts` | Dropdown selection options rendering. |
| `datetime` widgets | `tests/widgets/datetime.test.ts` | Date and datetime-local calendar picker inputs. |
| `FieldMany2one` | `tests/widgets/FieldMany2one.test.ts` | Autocomplete dropdown card, async name_search query results, Create and Edit button callbacks. |
| `FieldOne2many` | `tests/widgets/FieldOne2many.test.ts` | Embedded editable line lists, popup wizard fallback triggers. |
| `FieldMany2many` | `tests/widgets/FieldMany2many.test.ts` | Relational tags, initials fallback, and profile picture avatar lookups. |
| `FieldStatusbar` | `tests/widgets/FieldStatusbar.ts` (renamed `FieldStatusbar.test.ts`) | Header stages active highlight (#714B67) and statusbar_visible filter list. |
| Lightweight widgets | `tests/widgets/widgets.test.ts` | Phone clickable anchors, websites, badges, progresses, priorities, handles, tags. |

---

### 2.2 Renderers Tests Relocation (`tests/renderers/`)
Tests from the old monolithic `src/renderers.test.ts` are split and relocated into the following files:

| Target Component | Test Destination File | Focus of Assertions |
|------------------|-----------------------|---------------------|
| `FormRenderer` | `tests/renderers/FormRenderer.test.ts` | Form groups grid wrapping, notebook tab switching, header statusbars. |
| `ListRenderer` | `tests/renderers/ListRenderer.test.ts` | Tree table columns rendering, row click callbacks, editable list line items. |
| `CardRenderer` | `tests/renderers/CardRenderer.test.ts` | Kanban board columns, item grids, drag-and-drop state transitions. |
| `OdooNotebook` | `tests/renderers/OdooNotebook.test.ts` | Tab pages lazy-rendering performance limits. |
| Complex/Analytical | `tests/renderers/complex/` | Sub-view graph charts, pivot tables, gantt charts, and scheduling calendar views. |

---

## 3. Composable & Registry Tests Relocation

All helper, composable, and general registry tests are relocated cleanly:

*   Move `packages/vue-runtime/src/registry.test.ts` to `packages/vue-runtime/tests/registry.test.ts`.
*   Move `packages/vue-runtime/src/composables/useOdooField.test.ts` to `packages/vue-runtime/tests/composables/useOdooField.test.ts`.
*   Move `packages/vue-runtime/src/composables/useOdooRelationField.test.ts` to `packages/vue-runtime/tests/composables/useOdooRelationField.test.ts`.

---

## 4. Architectural Quality Gates & Testing Verification

1.  **Vitest Zero-Regression**:
    *   No test logical assertions are changed. 
    *   Run the workspace test suite (`npm run test`) to verify all 86+ high-fidelity tests inside `@odoo/vue-runtime` and `@odoo/sdk` pass 100%.
2.  **TypeScript & Build Parity**:
    *   Verify `@odoo/vue-runtime` and `@odoo/sdk` build cleanly via `npm run build`.
    *   Run `npx tsc --noEmit` across workspaces to confirm 100% type safety.
