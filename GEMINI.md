# 🌌 Odoo Semantic Compatibility SDK Workspace Protocol

This repository is dedicated to building and maintaining the **Odoo Semantic Compatibility SDK**, a high-performance, type-safe, pure TypeScript engine that implements Odoo's core server semantics while completely shedding the legacy implementation baggage of Odoo's native Web Client.

---

## 1. Core Vision & Paradigm Split

We align strictly with the **Odoo Semantic Contract** and explicitly reject the Odoo Web Implementation legacy.

```text
                Odoo Client SDK (TypeScript)
                       │
      ┌────────────────────────────────┐
      │                                │
   Runtime                         Compiler
      │                                │
 RPC Runtime                     XML Compiler
 ORM Runtime                     QWeb Compiler
 Domain Runtime                  Domain Parser
 Context Runtime                 Expression Parser
 Action Runtime                  Modifier Parser
 Security Runtime                Search Compiler
      │                                │
      └────────────────────────────────┘
                       │
               Semantic IR (JSON / AST)
                       │
      ┌──────────────┼──────────────┐
      │              │              │
   Vue Runtime   React Runtime  Flutter Runtime
```

*   **The Semantic Contract (COMPATIBLE)**:
    *   ORM structures (`RelationalModel`, `Record`, `onchange`, `default_get`, dynamic cache).
    *   Odoo Domain DSL (AST, prefix expressions).
    *   Context merges & Evaluation expression runtime.
    *   Action dispatching (`doAction()`, Stack & Router sync).
    *   Modifiers (`attrs`, `states`, `readonly`, `invisible`).
    *   Search definition and grouping pipelines.
    *   QWeb directive semantics (`t-if`, `t-foreach`, etc. mapped to universal elements).
*   **The Native Implementation (REJECTED)**:
    *   OWL component trees and local rendering rules.
    *   Odoo global Service Registry (`env.services`).
    *   Legacy widgets, class-based controllers, and custom XML compilers in the client.

---

## 2. Monorepo Directory Structure

The project is structured as a TypeScript monorepo under npm workspaces:

```text
odoo-client-sdk/
├── GEMINI.md               # Workspace Protocol (This File)
├── package.json            # Monorepo configuration (npm workspaces)
├── packages/
│   ├── sdk/                # Pure TypeScript SDK Core
│   │   ├── rpc/            # JSON-RPC, Session, Keep-Alive, Batching
│   │   ├── orm/            # RelationalModel, Record, Pinia-compatible reactivity
│   │   ├── domain/         # Domain AST Parser & Evaluator
│   │   ├── context/        # Context Evaluation & Expression Runtime
│   │   ├── action/         # ActionManager & Stack-router syncing
│   │   ├── arch/           # AOT XML Compiler (XML -> Semantic JSON IR)
│   │   └── qweb/           # QWeb AST Parser & IR Generator
│   ├── vue-runtime/        # Vue-specific rendering & Composables layer
│   │   ├── composables/    # useRecord, useCollection, useAction
│   │   ├── components/     # FieldRenderer, ViewRenderer
│   │   └── registry/       # Component-Based Widget Registry
│   └── react-runtime/      # (Planned) React-specific rendering layer
└── apps/
    └── web-client/         # Vue reference SPA client application
```

---

## 3. Core Architectural Paradigms

### A. First-Class DSL Compilers & Runtimes
Odoo's Custom DSLs are compiled to a standard, framework-agnostic **Semantic IR** (JSON) before reaching the presentation layer:
1.  **Domain Compiler**: Parses prefix domain arrays into an AST for client-side local evaluation (`ast.evaluate(context)`) and standard RPC normalization.
2.  **Expression Compiler**: Evaluates Odoo contextual python expressions (e.g., `company_id == current_company`) in JS.
3.  **QWeb & XML Compiler**: Translates Odoo View XML and QWeb nodes to an Intermediate Representation (`IfNode`, `ForNode`, `FieldNode`). Client runtimes never parse raw XML.

### B. Reactive & DI-Driven Integration
*   **Reactive ORM**: State tracking is delegated directly to the rendering framework's reactivity core (e.g. Pinia, reactive primitives). No heavy, redundant custom model dirty-trackers.
*   **Dependency Injection (DI)**: SDK services (notifications, dialogs, router) are mapped to standard DI mechanics (such as Vue `provide()` / `inject()`), ensuring clean architectural boundaries.

### C. Application Separation & Metadata-Driven Semantics
*   **Separation of Tests**: All app modules (such as `apps/web-client`) must physically separate test suites from production source code. Production source code belongs strictly under the `src/` directory, while all unit, integration, and E2E tests belong in a dedicated sibling `tests/` directory to prevent compilation and build layout contamination.
*   **Zero Hardcoded Demo Data**: Production source files are strictly metadata-driven and must contain no hardcoded mockup lists or demo records. Relational widgets (e.g. Odoo `<searchpanel>` fields like `category_id` or `user_id`) must resolve their options dynamically from the active Odoo database via ORM `search_read` pipelines, falling back to empty state representations if unconnected, while retaining test mock data strictly in test files under `tests/`.
*   **On-Demand Sidebar SearchPanel**: SearchPanel filters must strictly be rendered on-demand. The layout checks the compiled XML AST of the active action's search view (`searchArch`), mounting and displaying the sidebar filters if and only if a `<searchpanel>` node is explicitly declared.

### D. Vue Ecosystem Widget Integration & Adapter Design
We decouple Odoo field-rendering logic from any rigid presentation layer using a **Component-Based Widget Registry** (`componentRegistry` inside `@odoo/vue-runtime`):
1.  **Strict Adapter Contract**: Third-party Vue components (such as Element Plus, ECharts, or custom Tailwind elements) are encapsulated into light "adapter shells" that accept Odoo-standard props: `record` (RecordProxy), `name` (field name), `readonly` (boolean), and `options` (custom view parameters).
2.  **No Direct Core Coupling**: Client rendering engines (`FormRenderer` and `ListRenderer`) resolve widgets dynamically using `resolveFieldWidget()` and query the `componentRegistry`.
3.  **Zero-DOM Reactivity**: Modifying field values inside widgets is performed exclusively through the reactive `RecordProxy.set(name, value)` method, automatically triggering downstream dependencies, modifer evaluations, and backend onchanges without manual DOM manipulation.

---

## 4. Environment & Command Pipeline

-   **Runtime Environment**: Node.js `v24.x.x` (ESM native), npm `11.x.x`
-   **Core Commands (Planned Setup)**:
    *   Initialize packages: `npm install`
    *   Build complete workspace: `npm run build`
    *   Run test suite (Vitest): `npm run test`
    *   Static analysis / Linting: `npm run lint` (ESLint & Prettier)

---

## 5. Supreme Agent Alignment (ChatGPT & Gemini CLI Protocol)

*   **ChatGPT (Principal Architect)**: Controls decisions regarding the SDK API boundaries, compilation targets of Semantic IR, and architectural convergence.
*   **Gemini CLI (Execution Agent)**: Autonomously carries out TDD loops, writes and refactors modules in parallel, executes AST compilers, and preserves strict type safety. Always update corresponding tests with implementation.
