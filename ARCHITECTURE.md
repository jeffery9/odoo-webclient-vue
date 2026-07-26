# Odoo Semantic Compatibility SDK - Architecture Specification

This document details the architectural specification and design philosophies of the **Odoo Semantic Compatibility SDK**. 

---

## 1. Core Architecture Vision

The Odoo Semantic Compatibility SDK is a framework-agnostic, pure TypeScript implementation of Odoo's core server semantics. Its single, defining principle is:

> **Retain Odoo's Semantic Contract; completely reject Odoo's legacy Web Implementation.**

### A. Semantic Contract (Compatible) vs. Implementation (Rejected)

| Category | Semantic Contract (SDK Scope) | Native Implementation (Rejected) |
| :--- | :--- | :--- |
| **ORM** | Active-record properties, caches, transactional dirty checks, bulk loads, server-side dynamic `onchange` / `default_get` RPC pipelines. | Legacy model classes with heavy class-based state managers, local record caches fighting local DOM states. |
| **DSLs** | Evaluating prefix Odoo domains, dynamic Python-like Context Expressions, active Modifier parsing (`attrs`). | Complex local state machines, custom runtime context evaluators coupled with visual OWL components. |
| **Views** | Structural parsing of Odoo layout XML and template attributes (Form, List, Search). | Parsing XML at runtime in the client, applying view inheritance on the browser, compiling templates dynamically. |
| **QWeb** | Directive execution semantics (`t-if`, `t-foreach`, `t-set`, `t-call`). | Running Odoo's client-side QWeb template engines or compiling XML directly into OWL Component Templates. |

---

## 2. System Layering (Runtime & Compiler Split)

The architecture is split cleanly into a **Compiler Layer** (responsible for translating Odoo's string/XML DSLs into structured Intermediate Representations) and a **Runtime Layer** (responsible for state evaluation, ORM logic, and RPC execution).

```text
                               Odoo Server
                                    │
                                 JSON-RPC
                                    │
    ┌───────────────────────────────▼───────────────────────────────┐
    │                       Odoo Client SDK                         │
    │                                                               │
    │    ┌─────────────────────────────────────────────────────┐    │
    │    │                  Compiler Layer                     │    │
    │    │                                                     │    │
    │    │  XML View Compiler      ──►  Semantic JSON IR       │    │
    │    │  QWeb AST Parser        ──►  Intermediate ASTs      │    │
    │    │  Domain & Expr Parser   ──►  Static AST nodes       │    │
    │    └─────────────────────────────────┬───────────────────┘    │
    │                                      │                        │
    │    ┌─────────────────────────────────▼───────────────────┐    │
    │    │                   Runtime Layer                     │    │
    │    │                                                     │    │
    │    │  RPC client (Keep-Alive, merging session context)   │    │
    │    │  ORM state engine (Reactive RelationalModel, proxy) │    │
    │    │  Action Stack & Router Synchronization              │    │
    │    └─────────────────────────────────┬───────────────────┘    │
    └──────────────────────────────────────┼────────────────────────┘
                                           │
                                     Semantic IR
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
        ┌───────────────────────┐                     ┌───────────────────────┐
        │   Vue Runtime Layer   │                     │  React Runtime Layer  │
        │                       │                     │                       │
        │   Composable Hooks    │                     │   Functional Hooks    │
        │   Component-Based     │                     │   Component-Based     │
        │   Widget Registries   │                     │   Widget Registries   │
        └───────────────────────┘                     └───────────────────────┘
```

---

## 3. The Data Compilation Pipeline (AOT Views)

To guarantee high performance and light bundle sizes, **raw XML is never parsed on the client runtime**. The view definition flows through an Ahead-of-Time (AOT) compiler pipeline:

```text
 Raw XML (Odoo Arch)
         │
         ▼
 [ XML Parser ]  ──► Parses standard tags (`<form>`, `<field>`, `<group>`)
         │
         ▼
 [ QWeb Compiler ]  ──► Compiles directives (`t-if`, `t-foreach`) into AST blocks
         │
         ▼
   Semantic IR (Universal JSON structure)
         │
         ▼
 [ Framework Renderer (e.g., Vue) ]  ──► Directly generates VNode trees
```

### Example Transformation

**Odoo View Input XML**:
```xml
<form>
    <field name="partner_id" widget="many2one"/>
    <t t-if="record.state == 'done'">
        <field name="date_done"/>
    </t>
</form>
```

**Compiled Semantic JSON IR**:
```json
{
  "tag": "form",
  "children": [
    {
      "tag": "field",
      "attrs": {
        "name": "partner_id",
        "widget": "many2one"
      }
    },
    {
      "tag": "t",
      "type": "if",
      "expr": "state == 'done'",
      "children": [
        {
          "tag": "field",
          "attrs": {
            "name": "date_done"
          }
        }
      ]
    }
  ]
}
```

---

## 4. Key Architectural Pillars

### A. Reactive ORM (Proxy-Based)
Instead of replicating a manual class-based state manager, the ORM wraps standard Javascript objects in **Reactivity Proxies** provided by the rendering framework's core (e.g., Vue's `reactive()` or signal primitives).
- Field getters and setters are intercepted via proxy traps.
- Computational fields (`compute/inverse` logic) and active client-side `onchange` dependencies are managed automatically via a dynamic **Watch Graph** hooked into the reactivity system.

### B. Dependency Injection (DI) Service Bus
All core client infrastructure elements (notifications, router services, action managers, standard modal dialog controllers) are mapped through standard **DI (Dependency Injection)** mechanisms (like Vue's `provide` and `inject` context boundaries). This maintains strict decoupling of the core TypeScript SDK logic from the presentation runtime.

### C. Framework-Independent Component Registry
UI widgets are registered via a lightweight lookup system:
```ts
// packages/vue-runtime/src/registry/index.ts
Registry.register('field', 'many2one', VueFieldMany2oneComponent);
```
The central view renderer maps structural Semantic IR nodes directly to component registry lookup calls (`resolve('field', node.widget)`), enabling third-party plugins to seamlessly inject custom components without changing core framework codes.

### D. Controller-less MVVM Architecture (Dumb Views, Smart Proxies)
We completely reject Odoo's legacy MVC pattern (Model -> Renderer -> Controller -> View) in favor of a streamlined MVVM approach:
- **Smart Proxies (ORM Sink):** All data mutations and Odoo `onchange` logic are pushed down into the `RecordProxy`. When a renderer adapter calls `record.set('field', value)`, the proxy instantly captures the dirty state and automatically triggers the requisite ORM RPC evaluations.
- **Dumb Presentation Views:** Advanced visual components (Gantt, Pivot, Map, Graph) function as purely reactive presentation adapters. They do not contain any business routing or controller logic. They simply emit generic interaction intents (e.g., `onSelectRecord`).
- **Workspace Orchestration:** Global navigation and view transition state (e.g., clicking a map pin to open a Form view) are managed entirely by the central `MainWorkspace` and Action Manager router. This decouples visual rendering from action state routing, eliminating the need for bespoke View Controllers.

---

## 5. Deployment as a Native Odoo Addon Module

In production environments, the Compiled Web Client SPA can be packed and deployed directly as a native Odoo addon module. 

### A. Directory Structure
```text
my_custom_webclient/
├── __init__.py
├── __manifest__.py
│   # Manifest registers our static JS/CSS assets into Odoo asset bundles
├── controllers/
│   └── main.py  # Serves custom routing if needed
├── static/
│   └── src/
│       ├── js/
│       │   └── index-ClqcTrB4.js  # Compiled SPA assets
│       └── css/
│           └── index-style.css
└── views/
    └── templates.xml  # Embeds client mounting point (<div id="app">)
```

### B. Auto SSO Boot Sequence (Relative Host Mode)
Because the app is served from the same origin under the Odoo Addon directory, browser sessions and HttpOnly cookies (`session_id`) are automatically shared. 
1. Our configuration layer (`config.ts`) automatically detects `isOdooAddonMode() === true`.
2. The `main.ts` loader disables manual `isDevMode` config inputs and attempts passwordless relative authentication.
3. It directly triggers `/web/webclient/load_menus` using the current browser domain origin.
4. Odoo's web server authenticates the session automatically, bypassing the manual sign-in portal entirely and delivering a true seamless Single Sign-On (SSO) experience!

