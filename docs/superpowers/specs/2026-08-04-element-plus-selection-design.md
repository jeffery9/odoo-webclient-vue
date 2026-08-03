# 🌌 Specification: Premium Element Plus FieldSelection Dropdown Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Hook-Driven Composition Adapter Shell & Element Plus ElSelect API

---

## 1. Vision & Architecture

In Odoo Enterprise, `selection` fields are the standard way to represent static options (such as Sales Order Stages: Draft, Sent, Done; or Priority levels). We replace our hand-rolled HTML select tags in `FieldSelection.ts` with a premium Element Plus select dropdown component (`ElSelect` and `ElOption`).

```text
                  FormRenderer / FieldRenderer
                               │
                      Props: record, name, readonly, selection
                               │
                               ▼
                        [ FieldSelection ] (Adapter Shell)
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
    [ Readonly ]                                  [ Edit ]
         │                                           │
  - Find match in [value, label] tuple         - Render ElSelect
  - Display span with static text              - Map [value, label] to ElOption list
                                               - On Update: RecordProxy.set()
```

### 1.1 Pure Composition Adapter Rules
*   **Encapsulated State**: The select component integrates directly with `props.record.get(props.name)` and `props.record.set()`.
*   **Option Mapping**:
    *   The `selection` prop is passed as an array of `[value, label]` tuples (e.g., `[['draft', 'Draft'], ['sent', 'Quotation Sent']]`).
    *   These tuples map directly to `<el-option :value="item[0]" :label="item[1]" :key="item[0]"></el-option>`.
*   **Aesthetic Styling & Localized Themes**:
    *   **CSS Variable Injection**: We pass localized CSS overrides to ensure selection highlights and focus borders align with Odoo's corporate branding:
        ```css
        --el-color-primary: #714B67; /* Odoo Corporate Deep Purple */
        --el-color-primary-light-9: #f3eff2; /* Soft Purple Hover */
        --el-border-radius-base: 6px;
        ```

---

## 2. Package Dependency Declarations

Uses the existing, fully compiled `@odoo/vue-runtime` dependency list (which includes Element Plus).

---

## 3. Detailed Component Interface & UI Design

### 3.1 Edit Mode Layout
1.  **Wrapper Div**:
    *   Injects local CSS variables to color selection highlights purple (`#714B67`).
2.  **Select Option List**:
    *   Maps reactive `selection` property tuples into list options.

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Unit Assertions & Selection Tests**:
    *   The test suite `packages/vue-runtime/tests/widgets/FieldSelection.test.ts` must pass 100% cleanly.
    *   To support headless Vitest execution, we will mock `ElSelect` and `ElOption` inside our unit test suite.
    *   Assert that edit mode renders the Element Plus Select.
    *   Assert that selecting options updates the underlying RecordProxy active record state.
    *   Assert that readonly mode continues to degrade to static text spans.
2.  **TypeScript & Build Parity**:
    *   Verify the monorepo builds cleanly via `npm run build` with zero compiler errors.
