# 🌌 Specification: SearchView Period Comparison (期间比较 / YoY & MoM) Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Vue UX Architect  
**Status**: DRAFT  
**Core Pattern**: Date-Range Presets, Temporal Arithmetic Offset, and Segmented Analytical Meta-Payload

---

## 1. Vision & Architecture

In enterprise ERP analytics (such as financial, sales, or inventory reporting), **Period Comparison (期间比较)** is essential. It enables users to select a base date/period (e.g. "This month") and cross-compare metrics with a previous period (Month-over-Month, MoM) or the same period last year (Year-over-Year, YoY).

```text
                                  [ SearchView ]
                                         │
               ┌─────────────────────────┴─────────────────────────┐
         [ Grid Inputs ]                                   [ Period Comparison ]
               │                                                   │
      - char/many2one filters                             - Target Date Field selection
                                                          - Primary Period Preset
                                                          - Comparison Mode (YoY/MoM)
                                                                   │
                                                                   ▼
                                                       (Evaluate Date Arithmetic)
                                                                   │
                                                                   ▼
                                                       [ Emit: searchChange ]
                                                       - domain: standard filters
                                                       - comparison: temporal payload
```

---

## 2. Technical Interface & Date range Calculation

We will add a dedicated **Period Comparison Section (期间分析区)** inside the `SearchView` component in `@odoo/vue-runtime`.

### 2.1 UI Control Widgets
*   **Target Date Field Dropdown**: A small select `<el-select v-model="compareDateField" placeholder="目标日期字段">` containing all date and datetime fields extracted from the model metadata or arch.
*   **Primary Period Preset Selector**: A select dropdown `<el-select v-model="primaryPeriod" placeholder="选择期间">` with presets:
    *   `this_month` (本月)
    *   `this_quarter` (本季度)
    *   `this_year` (本年)
    *   `custom` (自定义区间)
*   **Custom Date Range Picker**: Displays `<el-date-picker type="daterange" v-model="customRange">` if `primaryPeriod === 'custom'`.
*   **Comparison Mode Selector**: A radio button group `<el-radio-group v-model="comparisonMode">` with options:
    *   `none` (不对比)
    *   `yoy` (同比 - Year-over-Year)
    *   `mom` (环比 - Month-over-Month)

---

### 2.2 Date Range Arithmetic Engine
We implement precise, client-side, zero-dependency date range calculations:

Given a pivot base date (defaulting to the current local browser date, e.g., `2026-08-04`):

#### 1. Primary Period calculation (`getPrimaryDateRange()`)
*   `this_month`: `['2026-08-01', '2026-08-31']`
*   `this_quarter`: Determine current quarter (e.g., Q3 is Jul-Sep) -> `['2026-07-01', '2026-09-30']`
*   `this_year`: `['2026-01-01', '2026-12-31']`
*   `custom`: Use values from `customRange`.

#### 2. Comparison Period calculation (`getComparisonDateRange(primaryStart, primaryEnd, mode)`)
Let $S_{p}$ and $E_{p}$ be the start and end dates of the primary period.
*   **Year-over-Year (YoY, 同比)**: Offset year by $-1$.
    *   $S_{c} = S_{p} \text{ with year } -1$
    *   $E_{c} = E_{p} \text{ with year } -1$
*   **Month-over-Month (MoM, 环比)**: Shift dates back by the length of the primary period in days or exact calendar months.
    *   For a single month $S_{p}$, offset month by $-1$ (e.g., `2026-08-01` -> `2026-07-01`, `2026-08-31` -> `2026-07-31`).

---

### 2.3 Search Change Meta-Payload Output
When search conditions update, the `SearchView` component emits:
```typescript
emit('searchChange', {
  domain: standardDomains,
  groupBy: activeGroupBys,
  comparison: comparisonMode !== 'none' ? {
    field: compareDateField,
    mode: comparisonMode,
    primaryRange: [primaryStartStr, primaryEndStr],
    comparisonRange: [comparisonStartStr, comparisonEndStr]
  } : null
});
```

---

## 3. Analytical Renderer Integration (Pivot / Graph)
Downstream renderers (like `PivotRenderer` and `GraphRenderer` inside `@odoo/vue-runtime`) can easily capture the emitted `comparison` payload:
- **Local Filtering**: Automatically evaluate and partition records into current vs. previous buckets.
- **Visual Presentation**: Render side-by-side comparative column graphs or double-table headers displaying growth ratios!

---

## 4. Quality Gates & Test Suites

1.  **Date Arithmetic Unit Tests**:
    *   Create dedicated test assertions inside `SearchView.test.ts` verifying correct start/end date calculations for YoY/MoM offsets.
2.  **Payload Verification**:
    *   Assert that changing primary presets and checking radio options compiles and emits the expected `comparison` payload flawlessly.
