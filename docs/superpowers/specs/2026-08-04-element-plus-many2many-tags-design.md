# 🌌 Specification: Premium Element Plus FieldMany2many Tags Chips Selector Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Hook-Driven Composition Adapter Shell & Element Plus Multi Remote Select API

---

## 1. Vision & Architecture

In Odoo Enterprise, `many2many_tags` is the standard widget used to represent dynamic lists of tags, labels, or categories with beautiful, colorful badges. We replace our hand-rolled tag list in `widgets.ts` (`FieldTag`) with a polished Element Plus remote-select tags component (`ElSelect` with `multiple: true`, `filterable: true`, and `allow-create: true`).

```text
                  FormRenderer / FieldRenderer
                               │
                      Props: record, name, readonly
                               │
                               ▼
                         [ FieldTag ] (Adapter Shell)
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
  [ Child Records ]                              [ ElSelect ]
         │ (RecordProxy / id-name list)               │ (multiple: true)
         ├───────────────────────────────────────────┤
         │                                           │
  On Tag Add / Remove                          On Value Update
  (e.g., Select option, type custom)           (Array of IDs / Strings)
  - Generate random ID for new typed tags     - value.value = updated record list
  - Map selected IDs to Odoo child records
```

### 1.1 Pure Composition Adapter Rules
*   **Encapsulated State**: The tag editor integrates directly with `props.record.get(props.name)` via reactive watch loops.
*   **Dynamic Remote Search Queries**: 
    *   The `ElSelect` component is configured with `multiple: true`, `filterable: true`, and `remote: true`.
    *   Input triggers `remote-method` which executes the RPC search method to populate database suggestions (e.g. `'res.partner.category'` or custom relations).
*   **On-The-Fly Tag Creation**:
    *   Configured with `allow-create: true` and `default-first-option: true`.
    *   When the user types a new tag (e.g. `'Enterprise'`) and hits Enter, Element Plus passes the typed string into the updated values array.
    *   The component intercepts string-type values, generates a random numeric ID, and maps them to Odoo-compliant `{ id, display_name, name }` relational objects.
*   **Aesthetic Styling & Localized Themes**:
    *   **CSS Variable Injection**: We pass localized CSS overrides to ensure selection chips and focus highlights align with Odoo's branding:
        ```css
        --el-color-primary: #714B67; /* Odoo Corporate Deep Purple */
        --el-color-primary-light-9: #f3eff2; /* Soft Purple Hover */
        --el-border-radius-base: 6px;
        ```
    *   **Color Palette Allocation**: Readonly tags degrade to static pill badges utilizing our custom modulo-based `TAG_COLORS` palette for vibrant visual cohesion.

---

## 2. Package Dependency Declarations

We add the following dependency to `packages/vue-runtime/package.json` (already installed in the previous bootstrap):
*   `element-plus`: Modular UI Library.

---

## 3. Detailed Component Interface & UI Design

### 3.1 Edit Mode Layout
1.  **Wrapper Div**:
    *   Injects local CSS variables to color selection highlights purple (`#714B67`).
2.  **Multi Select Option List**:
    *   Maps reactive `tagSuggestions.value` array into list options.
    *   Supports typing to filter, selecting suggestions to add, clicking chip `×` buttons to remove, and pressing Enter to create.

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Unit Assertions & Many2many Tags Tests**:
    *   The test suite `packages/vue-runtime/tests/widgets/FieldTag.test.ts` (or integrated in `widgets.test.ts`) must pass 100% cleanly.
    *   To support headless Vitest execution, we will inject a robust, lightweight **ElSelect Multi-Tag Mock Adapter** inside our unit test suite.
    *   Assert that edit mode renders the Element Plus Multi-Tag Select.
    *   Assert that typing triggers remote `search_read` suggestions.
    *   Assert that selecting options and typing custom tags translates correctly to Odoo record proxy array updates.
    *   Assert that readonly mode continues to degrade to a list of colorful static pill badges.
2.  **TypeScript & Build Parity**:
    *   Verify the monorepo builds cleanly via `npm run build` with zero compiler errors.
3.  **Visual and Aesthetic Verifications**:
    *   Start the reference application (`apps/web-client`) and visually confirm that the multi-tag selection behaves beautifully with absolute style alignment.
