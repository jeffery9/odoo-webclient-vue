# Odoo Semantic Compatibility SDK - Project TODO List

This TODO board tracks the atomic engineering tasks for the development of the Odoo Semantic Compatibility SDK.

---

## 🌌 Phase 1: DSL Compilers & AST Foundation

### Task 1.1: Domain DSL Parser & Evaluator
- [x] Define TypeScript types for the Domain AST structure (`packages/sdk/src/domain/ast.ts`).
- [x] Implement `Domain.parse(domain: string | any[])` to parse prefix notation into an AST.
- [x] Implement `Domain.normalize(domain)` to simplify and standardize ASTs.
- [x] Implement `Domain.toRPC(ast)` to serialize back to Odoo server-compatible prefix array notation.
- [x] Implement `Domain.evaluate(ast, recordContext)` to calculate a boolean result locally against a record's fields.
- [x] Write Vitest test suite for prefix array parsing, string parsing, normalization, and evaluation.

### Task 1.2: Context & Expression Runtime
- [x] Implement `Expression.parse(expr: string)` to generate a simple JavaScript-compatible expression tree.
- [x] Implement `Expression.evaluate(ast, evaluationEnv)` to evaluate python-like syntax (e.g., `company_id == current_company_id`, `uid`, simple ternary operators).
- [x] Implement the layered `Context` merger (`Action -> View -> Field -> User -> Session` to output `effective context`).
- [x] Write Vitest test suite verifying context merge priorities and expression evaluation.

### Task 1.3: Modifier DSL Compiler
- [x] Implement `Modifier.compile(attrs: Record<string, any>)` that wraps target rules into evaluated functions.
- [x] Implement `Modifier.evaluate(compiledModifiers, record)` returning reactive boolean statuses: `invisible`, `readonly`, `required`.
- [x] Write Vitest test suite for compiling Odoo `attrs` and testing active record states.

### Task 1.4: XML Arch & QWeb Compiler
- [x] Install `fast-xml-parser` as a workspace dependency.
- [x] Implement `ArchCompiler` to convert Odoo standard views (Form, List, Search) from XML string into standard Semantic JSON IR.
- [x] Implement `QWebCompiler` to parse directives (`t-if`, `t-foreach`, `t-esc`, `t-set`) into Semantic JSON IR blocks (`IfNode`, `ForNode`, `EscNode`).
- [x] Write Vitest test suite converting XML templates into clean, JSON-based AST outputs.

---

## 📡 Phase 2: Runtime Infrastructure (Communication & State)

### Task 2.1: RPC Runtime
- [x] Implement the HTTP JSON-RPC Client (`packages/sdk/src/rpc/client.ts`).
- [x] Handle session cookie injection, CSRF tokens, and custom HTTP header pooling.
- [x] Implement ORM endpoints: `call_kw`, `search_read`, `read`, `write`, `create`, `unlink`.
- [x] Implement error parser translating server stack traces into strict typed client-side JS Exceptions (`OdooAccessError`, `OdooValidationError`).
- [x] Write Vitest mocks verifying RPC request mapping and exception propagation.

### Task 2.2: Session Runtime
- [x] Create session state tracker managing `uid`, user company profiles, currency listings, and active contextual attributes.
- [x] Implement authentication APIs (`login`, `logout`) against Odoo controller endpoints.

---

## 🛢️ Phase 3: Reactive ORM Runtime (Data Engine)

### Task 3.1: Record & RelationalModel Setup
- [x] Define reactive JS Proxy wrappers around standard record fields to enable simple read/write traps.
- [x] Set up the memory-level transactional cache for dirty changes (`new`, `dirty`, `deleted`, `pending` states).

### Task 3.2: Store Integration (Watch Graph)
- [x] Create field dependency manager (Watch Graph) resolving computational field triggers.
- [x] Implement onchange handlers executing server-side or local dependency recalculations.

### Task 3.3: Field Lifecycle
- [x] Implement parser, formatter, and serializer rules for base types: `Char`, `Integer`, `Float`, `Selection`, `Boolean`.
- [x] Implement relationship serializers for complex relational fields: `Many2one`, `One2many`, `Many2many`.

---

## 🧭 Phase 4: Business Dispatching (Action & Router)

### Task 4.1: Action Runtime
- [x] Implement `ActionManager` maintaining the active action stack.
- [x] Handle window actions (`ir.actions.act_window`), client actions, and dynamic view-mode switching.
- [x] Implement navigation trace utilities (Breadcrumbs) and dialog state stacks.

### Task 4.2: Router Sync
- [x] Map action state and active records (`id`, `view_type`, `model`) to browser URL hashes.
- [x] Handle back/forward navigation history state restorations.

---

## 🎨 Phase 5: Vue Rendering Layer (Vue-Runtime)

### Task 5.1: Registry & DI Bus
- [x] Implement Component Registry mapped to standard Odoo widget mappings (e.g., `widget="many2one"` -> `FieldMany2one`).
- [x] Set up Vue `provide/inject` boundaries for global services (notification system, dialog modals).

### Task 5.2: View Renderers
- [x] Implement `ListRenderer` converting List Semantic JSON IR into table layouts with pager utilities.
- [x] Implement `FormRenderer` compiling Form Semantic JSON IR into flexible reactive layouts with notebook page structures.

### Task 5.3: Base UI Widgets
- [ ] Create essential field components: `FieldChar`, `FieldBoolean`, `FieldMany2one`.
- [ ] Create functional frame elements: `Notebook/Tabs`, `ControlPanel`, `ButtonBox`, `StatusBar`.

---

## 🧪 Phase 6: Assembly & E2E Validation

### Task 6.1: SPA Client Web App
- [ ] Scaffold `apps/web-client` as a Single Page Application mounting the root ViewRenderer and ActionManager.
- [ ] Configure Tailwind/CSS styles for modern interface visuals.

### Task 6.2: E2E and Continuous Integration
- [ ] Set up automated integration testing via Mock HTTP servers.
- [ ] Verify clean builds and baseline linting passes across all monorepo packages.
