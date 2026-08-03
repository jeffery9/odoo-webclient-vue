# 🌌 Specification: Premium Tiptap FieldHtml WYSIWYG Editor Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Hook-Driven Composition Adapter Shell & Tiptap Rich-Text API

---

## 1. Vision & Architecture

The native HTML `contenteditable` container is unstable and error-prone when handling cursor positions, text styling, and complex lists. We replace it with a premium, headless, and corporate-styled rich-text editor using **Apache Tiptap**.

```text
                  FormRenderer / FieldRenderer
                               │
                      Props: record, name, readonly
                               │
                               ▼
                        [ FieldHtml ] (Adapter Shell)
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
   [ useOdooField ]                          [ Tiptap Editor ]
         │ (Tracks value.value)                      │
         ├───────────────────────────────────────────┤
         │                                           │
  On External Update                           On Content Update
  (e.g., RPC/Onchange)                         (User types)
  - setContent(value.value)                     - value.value = getHTML()
```

### 1.1 Pure Composition Adapter Rules
*   **Encapsulated State**: The editor strictly integrates with `useOdooField(props)` via a reactive bidirectional `value.value` watch loop.
*   **Safe Selection Insertion**: Browser `window.getSelection()` and Range manipulators are completely discarded. We utilize Tiptap's standard `editor.commands.insertContent()` API, placing placeholders (`${object.field_name}`) exactly at the active cursor position.
*   **Odoo Aesthetic Style Overrides**:
    *   **Toolbar**: A modern, flat toolbar rendered directly using Vue `h()`.
    *   **Colors**: Active button states highlight in Odoo Deep Purple (`#714B67`) with white text. Inactive buttons have a subtle slate hover effect (`#f1f5f9`).
    *   **Editor Area**: Styled with `monospace` typography, consistent font sizing, and `6px` border-radius.

---

## 2. Package Dependency Declarations

We add the following dependencies to `packages/vue-runtime/package.json`:
*   `@tiptap/core`: Core editor classes.
*   `@tiptap/starter-kit`: General document extensions (Bold, Italic, Strike, Heading, BulletList, OrderedList, Paragraph, Document, Text).
*   `@tiptap/vue-3`: Vue 3 integrations.

---

## 3. Detailed Component Interface & UI Design

### 3.1 Layout Structure (Visual Edit)
The editor component will render three primary layout blocks:
1.  **Editor Header & Tab Bar**:
    *   Tab buttons: **Visual Edit** and **Live QWeb Preview**.
    *   A styled field dropdown selector (when in edit mode) to insert variables (`Insert Placeholder...`).
2.  **Rich-Text Formatting Toolbar** (visible only in Visual Edit and when `readonly` is false):
    *   **Formatting Actions**: Bold (`B`), Italic (`I`), Strike (`S`), Code (`</>`), Bullet List (`•`), Ordered List (`1.`), Clear Format (`⌫`).
    *   **Active states**: Highlighted with background `#714B67` and color `#ffffff`.
3.  **Editor Canvas** (the interactive Tiptap viewport):
    *   Class: `o_field_html o_template_editor_content tiptap_canvas`.
    *   Contenteditable state synchronized with `isReadonly.value`.

### 3.2 Live QWeb Preview Mode
When switched to the **Live QWeb Preview** tab, the Tiptap viewport is swapped for an immutable preview container rendering the HTML. Any variable placeholders like `${object.name}` or `${object.city}` are dynamically parsed using `props.record.toRawJSON()` (or falling back to `record.get()`) and replaced with real field values (`Mitchell Admin`, `Brussels`).

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Unit Assertions & WYSIWYG Tests**:
    *   The test suite `packages/vue-runtime/tests/widgets/FieldHtml.test.ts` must pass 100% cleanly.
    *   Assert that clicking formatting buttons executes correct editor commands.
    *   Assert that selecting fields from the dropdown inserts placeholders at the current cursor node.
    *   Assert that the compiled preview evaluates template values correctly.
2.  **TypeScript & Build Parity**:
    *   Compile the monorepo workspace cleanly using `npm run build` and ensure no TypeScript compiler errors.
3.  **Visual and Aesthetic Verifications**:
    *   Start the reference application (`apps/web-client`) and visually confirm that the Tiptap toolbar matches Odoo's branding guidelines perfectly.
