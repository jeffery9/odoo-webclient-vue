# Core SDK Tests Separation Implementation Plan

**Goal:** Relocate all 13 test files from the `packages/sdk/src/` production directory to a dedicated sibling `packages/sdk/tests/` folder. This aligns `@odoo/sdk` with the Separation of Tests protocol, making the production `src/` folder 100% free of unit/integration test logic and avoiding build/layout pollution.

---

### File Relocation Mapping and Relative Import Path Corrections

| Original Path | Target Path | Path adjustment |
| :--- | :--- | :--- |
| `packages/sdk/src/action/manager.test.ts` | `packages/sdk/tests/action/manager.test.ts` | `./` -> `../../src/action/` |
| `packages/sdk/src/action/router.test.ts` | `packages/sdk/tests/action/router.test.ts` | `./` -> `../../src/action/` |
| `packages/sdk/src/arch/compiler.test.ts` | `packages/sdk/tests/arch/compiler.test.ts` | `./` -> `../../src/arch/` |
| `packages/sdk/src/bus/client.test.ts` | `packages/sdk/tests/bus/client.test.ts` | `./` -> `../../src/bus/`, `../rpc` -> `../../src/rpc` |
| `packages/sdk/src/context/context.test.ts` | `packages/sdk/tests/context/context.test.ts` | `./` -> `../../src/context/`, `../domain` -> `../../src/domain` |
| `packages/sdk/src/context/expression.test.ts` | `packages/sdk/tests/context/expression.test.ts` | `./` -> `../../src/context/` |
| `packages/sdk/src/domain/parser.test.ts` | `packages/sdk/tests/domain/parser.test.ts` | `./` -> `../../src/domain/` |
| `packages/sdk/src/modifiers/modifier.test.ts` | `packages/sdk/tests/modifiers/modifier.test.ts` | `./` -> `../../src/modifiers/` |
| `packages/sdk/src/orm/fields.test.ts` | `packages/sdk/tests/orm/fields.test.ts` | `./` -> `../../src/orm/` |
| `packages/sdk/src/orm/onchange.test.ts` | `packages/sdk/tests/orm/onchange.test.ts` | `./` -> `../../src/orm/` |
| `packages/sdk/src/orm/record.test.ts` | `packages/sdk/tests/orm/record.test.ts` | `./` -> `../../src/orm/` |
| `packages/sdk/src/rpc/client.test.ts` | `packages/sdk/tests/rpc/client.test.ts` | `./` -> `../../src/rpc/` |
| `packages/sdk/src/session/session.test.ts` | `packages/sdk/tests/session/session.test.ts` | `./` -> `../../src/session/` |

---

### Execution Task Steps

- [ ] **Task 1: Bootstrap Target `packages/sdk/tests/` Directories**
  Create the folder directories in `packages/sdk/tests/`:
  - `action/`
  - `arch/`
  - `bus/`
  - `context/`
  - `domain/`
  - `modifiers/`
  - `orm/`
  - `rpc/`
  - `session/`

- [ ] **Task 2: Relocate Action & Arch Tests**
  - Move `packages/sdk/src/action/manager.test.ts` -> `packages/sdk/tests/action/manager.test.ts`
  - Move `packages/sdk/src/action/router.test.ts` -> `packages/sdk/tests/action/router.test.ts`
  - Move `packages/sdk/src/arch/compiler.test.ts` -> `packages/sdk/tests/arch/compiler.test.ts`
  - Adjust relative imports to point back to production source code.
  - Delete old test files.

- [ ] **Task 3: Relocate Bus, Context, Domain & Modifiers Tests**
  - Move `packages/sdk/src/bus/client.test.ts` -> `packages/sdk/tests/bus/client.test.ts`
  - Move `packages/sdk/src/context/context.test.ts` -> `packages/sdk/tests/context/context.test.ts`
  - Move `packages/sdk/src/context/expression.test.ts` -> `packages/sdk/tests/context/expression.test.ts`
  - Move `packages/sdk/src/domain/parser.test.ts` -> `packages/sdk/tests/domain/parser.test.ts`
  - Move `packages/sdk/src/modifiers/modifier.test.ts` -> `packages/sdk/tests/modifiers/modifier.test.ts`
  - Adjust relative imports.
  - Delete old test files.

- [ ] **Task 4: Relocate ORM, RPC & Session Tests**
  - Move `packages/sdk/src/orm/fields.test.ts` -> `packages/sdk/tests/orm/fields.test.ts`
  - Move `packages/sdk/src/orm/onchange.test.ts` -> `packages/sdk/tests/orm/onchange.test.ts`
  - Move `packages/sdk/src/orm/record.test.ts` -> `packages/sdk/tests/orm/record.test.ts`
  - Move `packages/sdk/src/rpc/client.test.ts` -> `packages/sdk/tests/rpc/client.test.ts`
  - Move `packages/sdk/src/session/session.test.ts` -> `packages/sdk/tests/session/session.test.ts`
  - Adjust relative imports.
  - Delete old test files.

- [ ] **Task 5: Global Verification & Commit**
  - Run `npm run build && npm run test` to verify that all 98+ tests continue to pass 100% green and everything compiles.
  - Stage all changes, commit under conventional message, and push live.
