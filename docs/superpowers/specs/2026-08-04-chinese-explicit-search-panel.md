# 🌌 Specification: Chinese ERP Explicit Search & Dynamic Grouping Panel

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Explicit Criteria Grid, Toggle Button Filters/GroupBys, and Sub-second Client/Server Dual Execution

---

## 1. Vision & Architecture

Unlike Western Odoo's autocomplete-dropdown search box, the **Chinese ERP Explicit Search Panel** places all searchable field criteria, predefined filters, and group-by rules directly on the screen as structured UI inputs and button groups.

```text
       ┌────────────────────────────────────────────────────────┐
       │                 [ OdooControlPanel ]                   │
       │                                                        │
       │  Explicit Input Grid (3-Column):                      │
       │  [ Field Name A : Input ]   [ Field Name B : Select ]  │
       │                                                        │
       │  Quick Filters (Toggles):                              │
       │  ( [ ] Filter 1 )  ( [ ] Filter 2 )  ( [ ] Filter 3 )  │
       │                                                        │
       │  Group By Rules (Toggles):                             │
       │  ( [ ] GroupBy 1 ) ( [ ] GroupBy 2 ) ( [ ] GroupBy 3 ) │
       └────────────────────────────────────────────────────────┘
                                   │ (Debounced/Immediate Emit)
                                   ▼
                       [ searchPanelDomain State ]
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼ (Client-Side)                             ▼ (Server-Side)
    [ filteredRecords ]                         [ RPC search_read ]
    - Evaluates Domain AST locally              - Sends combined domain params
    - Instant responsive render                 - Re-fetches database rows
```

---

## 2. Interface & Stateful Configurations

We will overhaul `OdooControlPanel.ts` to implement this design:

### 2.1 Search Criteria Grid
Each `<field>` declared in the `<search>` XML arch is rendered explicitly:
*   **Grid layout**: A CSS-Grid container styled with Tailwind (`grid grid-cols-1 md:grid-cols-3 gap-4 mb-4`).
*   **Widget selection**:
    *   **Text/Char Fields**: `<el-input v-model="fieldValues[name]"` with dynamic labels.
    *   **Selection / Many2one Relations**: `<el-select v-model="fieldValues[name]"` loaded dynamically with Odoo relational choices (VIP Clients, Standard Partners, Users, etc.).

### 2.2 Predefined Filters (快捷过滤)
Predefined Odoo `<filter>` domains are rendered as interactive toggles:
*   **Checkbox buttons**: Rendered as a horizontal row using `<el-checkbox-group>`.
*   **Toggles**: Clicking any item turns it on/off, appending its compiled domain string instantly to the active domains.

### 2.3 Predefined GroupBys (数据分组)
Predefined Odoo group-bys are rendered as stateful checkbox buttons:
*   **Stackable GroupBys**: Rendered using a distinct `<el-checkbox-group>` labeled **"数据分组 (Group By)"**.
*   **Dynamic Sequencing**: Activating multiple group-by rules dynamically updates the hierarchical drill-down order in downstream renderers (Pivot/Graph).

---

## 3. Execution Pipeline & local Evaluation Compatibility

1.  **Any input change triggers `updateSearchState`**.
2.  `updateSearchState` aggregates:
    *   **Active field search strings** -> Map to standard Odoo like domains (`['field', 'like', value]`).
    *   **Active filters** -> Parse and merge domains.
    *   **Active group-bys** -> Append context keys.
3.  Calls `props.onSearchChange({ domain, groupBy })`.
4.  The reactive `filteredRecords` computed property inside `state.ts` picks up `searchPanelDomain.value` and evaluates it locally using `@odoo/sdk`'s `Domain` AST executor, yielding a sub-second local search experience!

---

## 4. Quality Gates & Test Suites

1.  **AOT Compiler Verification**: Ensure all XML schemas compile cleanly into JSON IR.
2.  **Control Panel Assertions**:
    *   Verify that `OdooControlPanel` displays all search fields in a grid.
    *   Verify that selecting filters and typing text updates the active search domain properly.
3.  **Local State Verification**:
    *   Assert that `filteredRecords` filters record lists on-the-fly when active search domains change.
