# widgets.ts Monolith Deconstruction Implementation Plan

**Goal:** Physically split the monolithic `packages/vue-runtime/src/widgets/widgets.ts` file into ten individual, single-responsibility files inside the same directory, and update the ESM aggregator `index.ts`.

---

### File Deconstruction Mapping

| Component | Target File | Imports / Dependencies |
| :--- | :--- | :--- |
| `TAG_COLORS` | `packages/vue-runtime/src/widgets/tagColors.ts` | Shared color palette list |
| `FieldUrl` | `packages/vue-runtime/src/widgets/FieldUrl.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldEmail` | `packages/vue-runtime/src/widgets/FieldEmail.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldPhone` | `packages/vue-runtime/src/widgets/FieldPhone.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldBadge` | `packages/vue-runtime/src/widgets/FieldBadge.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldProgressBar` | `packages/vue-runtime/src/widgets/FieldProgressBar.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldPriority` | `packages/vue-runtime/src/widgets/FieldPriority.ts` | `defineComponent`, `h`, `ref` from `'vue'` |
| `FieldImage` | `packages/vue-runtime/src/widgets/FieldImage.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldHandle` | `packages/vue-runtime/src/widgets/FieldHandle.ts` | `defineComponent`, `h` from `'vue'` |
| `FieldTag` | `packages/vue-runtime/src/widgets/FieldTag.ts` | `defineComponent`, `h`, `ref`, `onMounted`, `computed` from `'vue'`; `ElSelect`, `ElOption` from `'element-plus'`; `TAG_COLORS` from `'./tagColors.js'` |
| `FieldAvatar` | `packages/vue-runtime/src/widgets/FieldAvatar.ts` | `defineComponent`, `h` from `'vue'`; `TAG_COLORS` from `'./tagColors.js'` |

---

### Execution Task Steps

- [ ] **Task 1: Create Shared `tagColors.ts` and Individual Component Files**
  - Create `packages/vue-runtime/src/widgets/tagColors.ts` containing the shared `TAG_COLORS` array.
  - Extract and write `FieldUrl.ts`, `FieldEmail.ts`, `FieldPhone.ts`, `FieldBadge.ts`, `FieldProgressBar.ts`, `FieldPriority.ts`, `FieldImage.ts`, `FieldHandle.ts`, `FieldTag.ts`, and `FieldAvatar.ts` each as isolated TS files.

- [ ] **Task 2: Delete Monolithic `widgets.ts`**
  - Delete `packages/vue-runtime/src/widgets/widgets.ts`.

- [ ] **Task 3: Refactor index.ts ESM Aggregator**
  - Update `packages/vue-runtime/src/widgets/index.ts` to import and export these ten widgets from their new individual files, matching ESM `.js` import conventions.

- [ ] **Task 4: Run Global Compilation & Verification**
  - Run `npm run build && npm run test` to verify that all 99 tests continue to compile and pass flawlessly.
  - Stage, commit, and push live.
