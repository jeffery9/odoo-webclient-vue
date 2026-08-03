# 🌌 Specification: Odoo List Inline Editing and Dynamic Row Decorations Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Compiled Row Expressions, Proxy-based Record Context Environment, and Row-Level Active Edit Mode

---

## 1. Vision & Architecture

Odoo's List View (tree) supports dynamic row coloring/decorations (such as `decoration-danger="state == 'draft'"`) and inline-editing via `editable="top|bottom"`. We replace the monolithic list view column cells with dynamic, row-level edit blocks.

```text
                                 [ ListRenderer ]
                                         │
                        [ Render Records Loop (rec) ]
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             ▼                                                       ▼
      [ activeRowId == rec.id ]                                [ activeRowId != rec.id ]
             │                                                       │
      - Render cell widgets                                   - Evaluate decorations matching rec
      - Set fields: [readonly=false]                          - Generate decoration style classes
                                                              - Render cells: [readonly=true]
```

---

## 2. Technical Designs

### 2.1 Dynamic Row Decorations via Compiled Python Expressions
The tree view attributes contain decorations like `decoration-danger="state == 'draft'"`. In `setup`, we compile all decoration-* attributes into Expression ASTs:
```typescript
const ast = Expression.parse(value);
```
We evaluate the AST for each row's record using a JS Proxy context wrapper:
```typescript
const getRecordEnv = (rec: any) => {
  return new Proxy({}, {
    get: (_, prop: string) => {
      if (typeof prop === 'string') {
        return rec?.get ? rec.get(prop) : rec?.[prop];
      }
      return undefined;
    }
  });
};
```
This is computationally light, highly responsive, and preserves full data reactivity!

---

### 2.2 Row-Level Active Edit State
When `props.arch?.attrs?.editable` is present:
- An active row ID is tracked: `activeRowId = ref<number | null>(null);`
- Clicking any row makes it active: `activeRowId.value = rec.id;`
- Sub-field widgets inside the active row are rendered with `readonly: false`, allowing seamless inline editing!
- All other rows remain in read-only mode (`readonly: true`).

---

## 3. Detailed Component Interfaces & Code Upgrades

We will apply these layouts and inline-editing upgrades to:
*   `packages/vue-runtime/src/renderers/ListRenderer.ts`

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Monorepo Compile Parity**:
    *   Verify the monorepo builds cleanly via `npm run build` with zero compiler errors.
2.  **Unit Tests Validation**:
    *   Update `packages/vue-runtime/tests/renderers/ListRenderer.test.ts` (or create one) to assert:
        *   Row clicking toggles row-level inline edit mode when `editable` is set.
        *   Dynamic row-level styles and text colors are correctly added according to decoration rules.
    *   All workspace tests must pass 100% green.
