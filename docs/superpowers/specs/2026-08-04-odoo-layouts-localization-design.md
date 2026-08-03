# 🌌 Specification: Odoo Grid Layout, View Modes, and Localized Internationalization Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Layered Separation of Semantic Data vs. Formatted Presentation & CSS Grid Columns Layout

---

## 1. Vision & Architecture

Odoo is a globally distributed enterprise system that handles varying localizations seamlessly. We formalize and implement full compatibility for:
1.  **View Modes (Edit vs. Readonly Mode)**: A view-level state that toggles the entire view and its sub-widgets dynamically.
2.  **CSS Grid Layout pairing**: Responsive multi-column layout groupings supporting Odoo's `<group col="X">` grids.
3.  **UTC Timezone translation**: Storing pure UTC times in the database and shifting local times on-the-fly for client displays.
4.  **Currency & Locale Formatting**: Resolving active currency symbols (`symbol`, `position`, `decimal_places`) to render formatted local currency numbers dynamically.

---

## 2. Technical Designs

### 2.1 View-Level Readonly Propagation in FormRenderer
`FormRenderer` accepts a `readonly` boolean property. When resolving fields inside the XML AST, we pass down the evaluated readonly state combined with the form's global mode:
```typescript
const isFieldReadonly = props.readonly || evaluated.readonly;
```

---

### 2.2 DateTime UTC Timezone Translation Shifter
Odoo stores datetimes in UTC in format `YYYY-MM-DD HH:mm:ss`. When displaying to users, we shift the time into their local browser timezone (supporting Odoo's userContext timezone if available).

```text
               Odoo Backend Database (UTC)
                           │
             "2026-08-04 02:00:00" (UTC string)
                           │
                           ▼
          [ FieldDatetime Display Parsing ]
        - Appends 'Z' -> "2026-08-04T02:00:00Z"
        - Instantiates client-local Date object
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
  [ Readonly Mode ]                     [ Edit Mode ]
- Format as Local Date String         - Pass Date object to picker
- "2026-08-04 10:00:00" (Asia/Shanghai)- Edits locally in local timezone
                                             │
                                             ▼
                               [ Value Serialization ]
                             - Formats local Date to UTCOdoo string:
                               "YYYY-MM-DD HH:mm:ss" UTC
```

---

### 2.3 FieldMonetary Currency Symbol & Locale Resolver
`FieldMonetary` reads the record's specified currency field (defaults to `currency_id`). It looks up details from `SessionManager`'s active currency dictionary to render prefixes/suffixes and local fraction grouping formatting.

```typescript
const currency = session?.currencies?.[currencyId] || { symbol: '$', position: 'before' };
// Readonly output: ¥1,500.00
// Edit output: [ ¥ ] [ 1500.00 ] (Grid input block)
```

---

## 3. Detailed Component Interfaces & Code Upgrades

We will apply the layout and localization upgrades across the following targeted components:
1.  `packages/vue-runtime/src/renderers/FormRenderer.ts` (View-level readonly propagation)
2.  `packages/vue-runtime/src/widgets/datetime.ts` (FieldDatetime UTC timezone shifter)
3.  `packages/vue-runtime/src/widgets/numeric.ts` (FieldMonetary currency symbol & format resolver)

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Monorepo Compile Parity**:
    *   Verify the monorepo builds cleanly via `npm run build` with zero compiler errors.
2.  **Unit Tests Validation**:
    *   Update `packages/vue-runtime/tests/widgets/datetime.test.ts` to assert UTC to Local timezone conversion during render, and Local to UTC conversion on input change.
    *   Update `packages/vue-runtime/tests/widgets/numeric.test.ts` to assert localized Monetary currencies.
    *   All 99+ tests must pass 100% green.
