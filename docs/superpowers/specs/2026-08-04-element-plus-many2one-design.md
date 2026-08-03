# 🌌 Specification: Premium Element Plus FieldMany2one Relational Select Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Hook-Driven Composition Adapter Shell & Element Plus Remote Select API

---

## 1. Vision & Architecture

Odoo's `Many2one` relational field is the backbone of navigation across enterprise master records (Customers, Products, Invoices, Accounts). We replace our hand-rolled basic autocomplete dropdown with a polished, highly responsive remote selector powered by Element Plus (`ElSelect` & `ElOption`).

```text
                  FormRenderer / FieldRenderer
                               │
                      Props: record, name, readonly
                               │
                               ▼
                        [ FieldMany2one ] (Adapter Shell)
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
   [ useOdooRelationField ]                       [ ElSelect ]
         │ (Suggestions, value)                      │
         ├───────────────────────────────────────────┤
         │                                           │
  On Remote Query                              On Option Selection
  (name_search RPC)                            (e.g., Mitchell Admin, Create...)
  - Populate suggestions                       - value.value = [id, name]
                                               - If '__create__', triggers dialog
```

### 1.1 Pure Composition Adapter Rules
*   **Encapsulated State**: The editor strictly integrates with `useOdooRelationField(props)` via a reactive bidirectional value binding.
*   **Dynamic Remote Search Queries**: 
    *   The `ElSelect` component is configured with `filterable: true` and `remote: true`.
    *   Input triggers `remote-method` which executes the hook's `search(query)` method, calling Odoo's backend ORM `name_search` with standard defensive debounce.
*   **Form Wizard Popovers**:
    *   We append a custom `ElOption` with key `'__create__'` and label `'+ Create and Edit...'` at the bottom of the list.
    *   Selecting this option interceptively blocks standard ORM updates and executes the hook's `openRelationForm()` method, launching the modal wizard.
*   **Interactive Readonly Link Navigation**:
    *   When `isReadonly` is true, standard input forms are replaced with standard clickable anchor `<a>` links.
    *   Clicking the link executes `openRelationForm(id)` to launch the relation card in a popup, maintaining Odoo-native contextual usability.

---

## 2. Package Dependency Declarations

We add the following dependency to `packages/vue-runtime/package.json` (already installed in the previous bootstrap):
*   `element-plus`: Modular UI Library.

---

## 3. Detailed Component Interface & UI Design

### 3.1 Edit Mode Layout
1.  **Wrapper Div**:
    *   Injects local CSS variables:
        ```css
        --el-color-primary: #714B67; /* Odoo Corporate Deep Purple */
        --el-color-primary-light-9: #f3eff2; /* Soft Purple Hover Background */
        --el-border-radius-base: 6px;
        ```
2.  **Virtualized/Standard Option Popover List**:
    *   Maps reactive `suggestions.value` array into list options.
    *   Appends the customized `+ Create and Edit...` option.

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Unit Assertions & Relational Select Tests**:
    *   The test suite `packages/vue-runtime/tests/widgets/FieldMany2one.test.ts` must pass 100% cleanly.
    *   To support headless Vitest execution, we will inject a robust, lightweight **ElSelect Mock Adapter** inside our unit test suite.
    *   Assert that edit mode renders the Element Plus Remote Select.
    *   Assert that querying options triggers remote `search`.
    *   Assert that selecting options triggers standard state updates and select callback hooks.
    *   Assert that clicking "+ Create and Edit..." triggers modal creation events.
2.  **TypeScript & Build Parity**:
    *   Verify the monorepo builds cleanly via `npm run build` with zero compiler errors.
3.  **Visual and Aesthetic Verifications**:
    *   Start the reference application (`apps/web-client`) and visually confirm that the custom options and dialog modals trigger seamlessly with absolute style alignment.
