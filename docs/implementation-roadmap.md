# Odoo Semantic Compatibility SDK - Implementation Roadmap

This document outlines the phased execution plan for building the Odoo Semantic Compatibility SDK, translating the 16-layer architecture into actionable development milestones.

## Phase 1: DSL Compilers & AST Foundation (The Core Intelligence)
*Goal: Establish the parsers and compilers that convert Odoo's legacy string-based DSLs and XML into standard JavaScript ASTs and Semantic IR.*

*   **Task 1.1: Domain DSL Parser**
    *   Implement string/array parser to Domain AST.
    *   Implement normalizer and RPC serializer.
    *   Implement client-side boolean evaluator against a context/record.
*   **Task 1.2: Context & Expression Evaluator**
    *   Implement a safe Python-to-JS expression evaluator for Odoo contexts (e.g., `uid`, `active_id`, simple math/logic).
    *   Implement Context merge logic (Action -> View -> Field -> User).
*   **Task 1.3: Modifier DSL Compiler**
    *   Compile `attrs` (e.g., `{'invisible': [('state', '=', 'draft')]}`) into reactive boolean dependencies using the Domain and Expression evaluators.
*   **Task 1.4: XML Arch & QWeb Compiler**
    *   Implement the XML Parser (using a lightweight library like `fast-xml-parser` or `xmldom`).
    *   Translate RNG schemas (Form, List, Common) into TypeScript AST interfaces.
    *   Implement the Compiler that transforms raw XML into `CompiledViewIR` (JSON).

## Phase 2: Runtime Infrastructure (Communication & State)
*Goal: Build the base runtime for connecting to Odoo and managing session state.*

*   **Task 2.1: RPC Runtime**
    *   Implement `call_kw`, `search_read`, `read`, `write`, `create`, `unlink`.
    *   Add Session ID injection, CSRF handling, and error wrapping.
    *   *(Optional Extension)* Implement RPC Batching mechanism.
*   **Task 2.2: Session Runtime**
    *   Manage current user data (`uid`, `company_id`, `tz`, `lang`).
    *   Implement login/logout flows against Odoo controllers.

## Phase 3: Reactive ORM Runtime (The Data Engine)
*Goal: Replace Odoo's complex RecordCache/VirtualRecord with a modern, reactive data store.*

*   **Task 3.1: Record & RelationalModel Interface**
    *   Define the shape of a Reactive Record (proxying field reads/writes).
*   **Task 3.2: Store Implementation (Pinia-agnostic Core)**
    *   Implement the dependency graph tracking (watchers) for `onchange` and `compute` fields.
    *   Implement dirty state tracking and save/discard actions.
*   **Task 3.3: Field Lifecycle**
    *   Implement base field formatters, parsers, and validators (`Char`, `Many2one`, `One2many`, etc.).

## Phase 4: Business Dispatching (Action & Router)
*Goal: Handle user navigation and window/dialog management.*

*   **Task 4.1: Action Runtime**
    *   Implement `doAction` dispatcher (handling `ir.actions.act_window`, `ir.actions.client`, etc.).
    *   Implement breadcrumb stack and dialog state management.
*   **Task 4.2: Router Sync**
    *   Sync Action Stack state with browser URL (hash or history mode).

## Phase 5: The Vue Rendering Layer (Consuming the IR)
*Goal: Build the presentation layer that reads the Semantic IR and renders Vue components.*

*   **Task 5.1: Registry & DI Bus**
    *   Implement the Component Registry (`FieldWidget`, `ViewWidget`).
    *   Set up the global Notification & Dialog bus using Vue `provide/inject`.
*   **Task 5.2: View Renderers**
    *   Implement `FormRenderer` and `ListRenderer` that consume `CompiledViewIR`.
*   **Task 5.3: Base Widgets**
    *   Implement essential Vue components (`FieldChar`, `FieldMany2one`, `Notebook`, `Button`).

## Phase 6: Assembly & E2E Validation
*Goal: Wire everything together in the `web-client` app and run end-to-end tests.*

*   **Task 6.1: App Scaffolding**
    *   Initialize Vue application, inject session, and mount the root ActionManager/Router.
*   **Task 6.2: Mock Server & TDD**
    *   Setup mock RPC responses to simulate an Odoo server for automated Vitest execution.

## Execution Rules
- **TDD First**: Every compiler and runtime module MUST be written alongside its test suite (Vitest).
- **Strict Typing**: All SDK code must remain pure TypeScript. No Vue/UI dependencies are allowed inside `packages/sdk`.
- **Iterative Approval**: At the end of each Phase, a review checkpoint is required before moving to the next.
