# 🌌 Specification: Premium Element Plus FieldDate & FieldDatetime Upgrades

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Hook-Driven Composition Adapter Shell & Element Plus DatePicker API

---

## 1. Vision & Architecture

The basic native date/datetime browser inputs are visually inconsistent across platforms and lack professional scheduling and formatting tools. We replace them with Element Plus's elegant, accessible, and highly robust calendar picker component (`ElDatePicker`).

```text
                  FormRenderer / FieldRenderer
                               │
                      Props: record, name, readonly
                               │
                               ▼
                    [ FieldDate / FieldDatetime ] (Adapter Shell)
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
   [ useOdooField ]                           [ ElDatePicker ]
         │ (Tracks value.value)                      │
         ├───────────────────────────────────────────┤
         │                                           │
  On External Update                           On Content Update
  (e.g., RPC/Onchange)                         (User picks date)
  - Bind to picker modelValue                  - Format date back to Odoo format
                                               - value.value = formatted string
```

### 1.1 Pure Composition Adapter Rules
*   **Encapsulated State**: The editor strictly integrates with `useOdooField(props)` via a reactive bidirectional `value.value` watch loop.
*   **Safe Serialization / Bidirectional Parsing**:
    *   **FieldDate**: Odoo dates are simple strings `'YYYY-MM-DD'`. When reading, we pass this string directly to the picker. When writing, we format the resulting JS Date object to `'YYYY-MM-DD'` and write back.
    *   **FieldDatetime**: Odoo datetimes are UTC strings `'YYYY-MM-DD HH:mm:ss'`. When reading, we convert space to `'T'` to form standard ISO formatting. When writing, we format the resulting JS Date object to `'YYYY-MM-DD HH:mm:ss'` and write back.
*   **Odoo Aesthetic Style Overrides**:
    *   **CSS Variable Injection**: We wrap the DatePicker inside a localized container styled with Element Plus CSS variables:
        ```css
        --el-color-primary: #714B67; /* Odoo Corporate Deep Purple */
        --el-color-primary-light-9: #f3eff2; /* Soft Purple Hover Background */
        --el-border-radius-base: 6px;
        ```
    *   **Readonly Mode**: When `isReadonly` is true, the DatePicker element is hidden completely and replaced with an elegant, plain span:
        *   `FieldDate`: `h('span', { class: 'o_field_date o_readonly' }, strVal)`
        *   `FieldDatetime`: `h('span', { class: 'o_field_datetime o_readonly' }, strVal.replace('T', ' '))`

---

## 2. Package Dependency Declarations

We add the following dependency to `packages/vue-runtime/package.json`:
*   `element-plus`: Modular UI Library.

---

## 3. Detailed Component Interface & UI Design

### 3.1 Layout Structure (FieldDate & FieldDatetime)
1.  **Edit Mode (readonly is false)**:
    *   Renders a container div styled with our local CSS brand variables.
    *   Inside, renders `ElDatePicker` passing:
        *   `modelValue`: `value.value`.
        *   `type`: `'date'` for `FieldDate`, and `'datetime'` for `FieldDatetime`.
        *   `format`: `'YYYY-MM-DD'` for date, and `'YYYY-MM-DD HH:mm:ss'` for datetime.
        *   `placeholder`: Custom localized string (e.g. `'Select date'`).
        *   `onChange` / `onUpdate:modelValue`: Capture selected value, format it to Odoo standard date or datetime strings, and write back to `value.value`.
2.  **Readonly Mode (readonly is true)**:
    *   Renders a plain `span` styled with modern grey typography and a consistent, clean height matching form view alignments.

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Unit Assertions & Calendar Tests**:
    *   The test suite `packages/vue-runtime/tests/widgets/datetime.test.ts` must pass 100% cleanly.
    *   Assert that edit mode renders the Element Plus DatePicker with proper parameters.
    *   Assert that selecting dates and datetimes serializes back to Odoo standard string formats correctly.
    *   Assert that readonly mode degrades cleanly.
2.  **TypeScript & Build Parity**:
    *   Compile the monorepo workspace cleanly using `npm run build` and ensure no TypeScript compiler errors.
3.  **Visual and Aesthetic Verifications**:
    *   Start the reference application (`apps/web-client`) and visually confirm that the calendar popover dropdown matches Odoo's branding guidelines perfectly.
