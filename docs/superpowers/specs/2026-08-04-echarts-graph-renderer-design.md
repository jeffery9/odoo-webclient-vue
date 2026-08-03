# 🌌 Specification: Premium Apache ECharts GraphRenderer Upgrade

**Date**: 2026-08-04  
**Author**: Gemini CLI & Data Visualization Engineer  
**Status**: DRAFT  
**Core Pattern**: Vue Composition API, Direct ECharts Instance Wrapping, and Auto-Resize hooks

---

## 1. Vision & Architecture

Our static hand-rolled SVG charts lack standard enterprise capabilities: hover tooltips, visual animations, interactive legends, fluid type toggling, and layout responsiveness. We replace them with a premium charting engine powered directly by **Apache ECharts**.

```text
                     FormRenderer / ActionManager
                               │
                       Props: arch, records
                               │
                               ▼
                       [ GraphRenderer ] (Adapter Shell)
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
   [ Header Toolbars ]                        [ ECharts Canvas ]
   (Chart type toggles:                       - mounted via echarts.init(el)
    Bar / Line / Pie)                         - option computed from type
                                              - resize observer listening
```

### 1.1 Pure Composition Adapter Rules
*   **Direct DOM Mounting**: We use a Vue `ref` on a container `div` and initialize the ECharts instance via `echarts.init(el)` inside the `onMounted` lifecycle hook. This avoids extra, opinionated third-party Vue wrappers and keeps our dependency footprint lightweight.
*   **Auto-Resize Hook**: We register a `ResizeObserver` on the canvas element (or window resize listener) to automatically execute `myChart.resize()` whenever bounds shift, securing 100% layout responsiveness.
*   **Corporate Branding Color Mapping**:
    *   **Palette**: `['#714B67', '#01A299', '#EC9A29', '#E85F5C', '#1F7A8C']` (Odoo Deep Purple, Teal, Amber Yellow, Coral Red, Quiet Blue).
    *   **Typography**: Styled to use standard corporate sans-serif fonts, clean tooltips, and high-readability labels.
*   **State Clean-up**: In `onBeforeUnmount`, we call `myChart.dispose()` to prevent browser memory leaks.

---

## 2. Package Dependency Declarations

We add the following dependency to `packages/vue-runtime/package.json`:
*   `echarts`: Official Apache ECharts package (fully type-safe out of the box in v5+).

---

## 3. Detailed Component Interface & UI Design

### 3.1 Control Panel & Header Toolbar
The `GraphRenderer` will render a premium header control panel:
1.  **Chart Title**: Dynamic string extracted from `arch.attrs.string` (e.g., `Partner Analysis`).
2.  **View Mode Toggles** (Odoo-native design):
    *   Buttons: **Bar Chart**, **Line Chart**, **Pie Chart** (represented as text or icons).
    *   Clicking a toggle dynamically overrides the active chart type ref, reconstructing the ECharts configuration on-the-fly and updating the canvas with animated transitions (`chart.setOption(option, true)`).

### 3.2 ECharts Data Compilation Logic
Odoo's `records` are parsed, grouping by the row field (e.g. `name` or `category_id`) and aggregating the measure field (defaulting to record count if omitted):
*   **Bar Chart**:
    *   X-Axis: category labels.
    *   Y-Axis: value.
    *   Series: `bar` type with rounded corners (`borderRadius: [4, 4, 0, 0]`).
*   **Line Chart**:
    *   X-Axis: category labels.
    *   Y-Axis: value.
    *   Series: `line` type with smooth curves (`smooth: true`), thick lines (`strokeWidth: 3`), and hover points.
*   **Pie Chart**:
    *   Series: `pie` type with central circular labels and formatted legend dividers (`Name (Value)`).

---

## 4. Architectural Quality Gates & TDD Verifications

1.  **Vitest Headless Chart Verifications**:
    *   The test suite `packages/vue-runtime/tests/renderers/complex/GraphRenderer.test.ts` must pass 100% cleanly.
    *   To support headless Jest/Vitest execution (where canvas elements do not render and ECharts can throw errors due to width/height being 0), we will inject a robust, lightweight **ECharts Mock Adapter** inside our Vitest test environment or mock the core `echarts` API, asserting that configuration options are computed, registered, and updated correctly.
2.  **TypeScript & Build Parity**:
    *   Verify the monorepo builds cleanly via `npm run build` with zero compiler errors.
3.  **Visual Integrations**:
    *   Visually verify in `apps/web-client` that charts resize fluently, tooltips hover beautifully, and colors align exactly with Odoo Corporate guidelines.
