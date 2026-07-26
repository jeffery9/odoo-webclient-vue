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
