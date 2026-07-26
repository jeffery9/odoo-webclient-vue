# Domain-driven Packages Refactoring Spec

**Date**: 2026-07-26  
**Status**: APPROVED  
**Author**: Gemini CLI

---

## 1. Goal & Vision
The reference application `apps/web-client/src/main.ts` currently serves as a monolithic entry point containing raw reactive states, Odoo actions, HTTP authenticators, and massive virtual DOM elements.
This specification divides this monolith into four highly cohesive, domain-driven subpackages:
*   `auth/` (Credentials, SSO, active Odoo connection state, connection forms)
*   `layout/` (Application layout, left subsections panel, top bar, dynamic navigation menus)
*   `workspace/` (Active records, compiled XML architectures, view-type togglers, ORM state operations)
*   `main.ts` (Dynamic assembly shell & HashRouter synchronizer)

---

## 2. Directory Structure

```text
apps/web-client/src/
├── config.ts                    # Physical/relative route sniffing & SSO detection
├── main.ts                      # App entry point, Orchestrator layout & Hash Router bindings
├── auth/                        # Domain Package: Authentication
│   ├── state.ts                 # auth state variables (isAuthenticated, activeClient)
│   └── LoginPortal.ts           # Login Portal UI renderer
├── layout/                      # Domain Package: Navigational shell & Controls
│   ├── state.ts                 # navigation state variables (menus, activeMenu)
│   └── ControlPanel.ts          # Breadcrumbs, Action triggers, Pager & search panel components
└── workspace/                   # Domain Package: Active Workspace
    ├── state.ts                 # record states, active view type, active action, view arches
    ├── actions.ts               # Odoo Action runner, record saving/discarding/creation
    └── MainWorkspace.ts         # Central grid renderer (List, Card Kanban, Form views)
```

---

## 3. Communication Protocols & APIs

### A. Authentication Contract
*   `activeClient`: Reactive reference of `RPCClient | null`. Accessible by `workspace/actions.ts` to coordinate remote calls.
*   `isAuthenticated`: Flag signaling viewport selection (`LoginPortal` vs `MainWorkspace`).
*   `persistSettings()`: Saves parameters into local storage.

### B. Action/State Interaction
*   `activeAction`: Extracted model metadata & context layers evaluated JIT using `Context.merge`.
*   `partnerRecords`: Reactive array of active `RecordProxy` items currently visual in the client.

### C. UI Component Exports
*   Components are declared as pure functional renderers returning standard `VNode` layers using Vue's `h()` function to preserve runtime lightweight characteristics.

---

## 4. Verification & Testing Strategy
*   Refactoring must preserve 100% of the existing Vitest integration scenarios inside `webclient.test.ts`.
*   A newly designed test suite must verify domain-level reactivity boundaries.
