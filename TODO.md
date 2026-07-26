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
- [x] Create essential field components: `FieldChar`, `FieldBoolean`, `FieldMany2one`.
- [x] Create functional frame elements: `Notebook/Tabs`, `ControlPanel`, `ButtonBox`, `StatusBar`.

---

## Phase 6: Assembly & E2E Validation

### Task 6.1: SPA Client Web App
- [x] Scaffold `apps/web-client` as a Single Page Application mounting the root ViewRenderer and ActionManager.
- [x] Configure Tailwind/CSS styles for modern interface visuals.
- [ ] Add high-fidelity, app-specific SVG icons to the Enterprise App Switcher dashboard for Sales, Purchase, Inventory, Accounting, and other core Odoo models.

### Task 6.2: E2E and Continuous Integration
- [x] Set up automated integration testing via Mock HTTP servers.
- [x] Verify clean builds and baseline linting passes across all monorepo packages.

---

## 🎨 Phase 7: View Layout Semantic Alignment (Odoo UI/UX Fidelity)

### Task 7.1: `<header>` & `<statusbar>` Layouts
- [ ] Render the statusflow bar at the top of Form views.
- [ ] Parse `statusbar_visible` and compute active state highlighting.
- [ ] Render functional stage transition buttons (e.g., "Confirm", "Draft").

### Task 7.2: `<sheet>` & `<group>` / `<col>` Responsive Grid
- [x] Implement Odoo's classic dual-column or multi-column grid via CSS Grid.
- [x] Ensure inner `<group>` tags align labels to the left and inputs to the right.
- [x] Apply the `<sheet>` white-card shadow layout constraints.
- [x] Deploy global mobile media queries (@media 768px) to auto-stack sidebars, control panel blocks, form grids, and App Switcher tiles on small viewports.
- [ ] Correct Form field display layout split: Render both the semantic label (from XML string or ORM field name) and the reactive value/widget correctly, with pixel-perfect alignment inside `<group>` grid columns.

### Task 7.3: `<notebook>` & `<page>` Tabs
- [ ] Build responsive Tab view components to handle `<notebook>`.
- [ ] Lazy-load or conditionally render `<page>` contents to optimize performance, especially for One2many/Many2many sub-lists.

### Task 7.4: Title, Avatar & Lists Semantics (per `list_view.rng`)
- [ ] Implement layout rules for `oe_title` (large font headers) and `oe_avatar` (floating top-right image placeholders).
- [ ] Support `decoration-*` attributes (e.g., `decoration-danger`, `decoration-muted`) for dynamic row styling based on record state in lists.
- [ ] Implement `editable="top|bottom"` for inline list editing without opening a form view.

### Task 7.5: Analytics & Search View Semantics (per `graph_view.rng`, `pivot_view.rng`, `search_view.rng`)
- [ ] Graph: Support `type="bar|pie|line"`, `stacked`, and `cumulated` attributes for advanced charts.
- [ ] Pivot: Support `disable_linking`, `display_quantity`, and dynamic measurement aggregations.
- [ ] Search: Fully align `<searchpanel>` and hierarchical `<filter>` semantics to standard Odoo behaviors.

---

## ⚙️ Phase 8: View State Management & Finite-State Controls

### Task 8.1: Read/Write Mode Transition (Readonly State)
- [ ] Implement global `readonlyMode` state toggling in workspaces.
- [ ] Auto-degrade all input widgets (select, input, relations) into plain text spans when in readonly mode.
- [ ] Wire up the "Edit", "Save", and "Discard" control panel buttons.

### Task 8.2: Transaction Cache & Rollover
- [ ] Utilize `RecordProxy._changes` to track modified fields.
- [ ] Clear modifications on "Discard" and restore pristine state.
- [ ] Implement robust error handling and validation hooks before "Save" (RPC write/create).

### Task 8.3: Dynamic Modifiers & Conditional Styling
- [ ] Execute real-time evaluation of Python-style modifier expressions (using the upgraded SDK Modifier engine) upon every field change.
- [ ] Dynamically mount/unmount DOM nodes (`invisible`) or toggle input states (`readonly` / `required`).
- [ ] Implement dynamic field value state control (readonly, required, invisible) synchronized with active view-mode toggles and dynamic Python-style modifier evaluations.

### Task 8.4: RPC Onchange Cascades
- [ ] Intercept field updates and automatically dispatch `/web/dataset/call_kw/onchange` requests to Odoo.
- [ ] Merge the returned `value` payload into the proxy and update the DOM reactively.
- [ ] Apply the returned `domain` restrictions to relational widgets (e.g., filtering `state_id` when `country_id` changes).

---

## 🔗 Phase 9: Relational Widget Hardening (M2O, O2M, M2M)

### Task 9.1: Many2one Enhancements
- [ ] Implement debounce-based Search/Autocomplete dropdowns.
- [ ] Add "Search More..." modal popup support.

### Task 9.2: One2many / Many2many Inline Editing
- [ ] Implement inline row addition (Add a line) in Sub-List (tree) views.
- [ ] Support popup form dialogs for complex O2M record creation.

---

## 🚀 Phase 10: GitHub Open Source Readiness (DevOps & Docs)

### Task 10.1: Documentation & Guides
- [ ] Document the architecture (AOT XML Compilation, Zero-DOM reactivity, and Controller-less MVVM) in a comprehensive `README.md`.
- [ ] Expand on `docs/` folder containing `ARCHITECTURE.md`, `LAYOUT.md`, and custom Widget Renderer development.

### Task 10.2: CI/CD Pipeline Setup
- [ ] Automate Vitest test runs for PRs.
- [ ] Setup ESLint / Prettier code quality gates.
- [ ] Automate NPM package publishing (`@odoo/sdk`, `@odoo/vue-runtime`).

### Task 10.3: Mock Sandbox Environment
- [ ] Provide a standalone, mocked Vite environment (or Dockerized Odoo) so contributors can run the Web Client without a live backend.

---

## 🌌 Phase 11: Ecosystem & Extensibility

### Task 11.1: Action Manager Extensibility
- [ ] Polish support for `ir.actions.report` (PDF downloads).
- [ ] Polish support for `ir.actions.client` (Custom Vue components).

### Task 11.2: Widget Registry Plugin System
- [ ] Document how third-party developers can inject custom Vue widgets (e.g., Map, Gantt, Chart) into the `componentRegistry` without modifying the core.
