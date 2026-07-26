# Odoo Web Client Layout & Component Architecture

This document maps out the screen layout and component state relationships of the Odoo Semantic Compatibility Web Client (`apps/web-client`).

---

## 1. Physical Screen Layout (物理界面排版)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Navbar (系统顶栏: 包含 Odoo 主菜单、🏢 多公司切换器、🔔 实时通知中心、👤 登录态)          │
├───────────────────┬────────────────────────────────────────────────────────────────────┤
│                   │  OdooControlPanel (Odoo 控制面板: 搜索框、筛选、分组、比较、收藏)    │
│  OdooSearchPanel  ├────────────────────────────────────────────────────────────────────┤
│  (层级过滤侧边栏  │  Main Content Container (主视图区域 - 依据 activeViewType 动态挂载)│
│   el-tree 树状)   │  ┌──────────────────────────────────────────────────────────────┐  │
│                   │  │                                                              │  │
│        OR         │  │  [ activeViewType ]                                          │  │
│                   │  │  - 'list'  : ListRenderer (高逼真数据表格)                   │  │
│  o_sidebar        │  │  - 'kanban': KanbanRenderer (卡片流式布局)                   │  │
│  (快捷二级跳转)   │  │  - 'form'  : FormRenderer (双向同步表单)                     │  │
│                   │  │  - 'graph' : PremiumGraphRenderer (ECharts 柱/折/饼大盘)     │  │
│                   │  │  - 'pivot' : PremiumPivotRenderer (多维网格透视表)           │  │
│                   │  │  - 'gantt' : PremiumGanttRenderer (Frappe 交互甘特图)         │  │
│                   │  │                                                              │  │
│                   │  └──────────────────────────────────────────────────────────────┘  │
└───────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component State & Data Flow Relationship (组件数据流向图)

Our architecture is strictly **MVVM and event-driven**, ensuring high decoupling between Odoo XML schema parsing and UI rendering primitives.

```
                         ┌────────────────────────┐
                         │  SessionManager (Auth) │
                         └───────────┬────────────┘
                                     │ activeClient
                                     ▼
                        ┌──────────────────────────┐
                        │   MainWorkspace (MVVM)   │◄─────────────┐
                        └──────┬───────────────┬───┘              │
                               │               │                  │
               activeAction /  │               │ onSearchChange   │
               filteredRecords │               │ (Domains)        │
                               ▼               ▼                  │
                    ┌──────────────────┐ ┌────────────────────┐   │
                    │ OdooSearchPanel  │ │  OdooControlPanel  │───┘
                    │ (层级分类el-tree)│ │ (筛选/分组/比较/收藏)│
                    └──────────────────┘ └────────────────────┘
                               │
            ┌──────────────────┼──────────────────┬──────────────────┐
            ▼                  ▼                  ▼                  ▼
  ┌──────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
  │   ListRenderer   │ │  FormRenderer  │ │PremiumGraphRen │ │PremiumPivotRen │
  │ (Odoo 列表渲染器)│ │(表单/动态修改) │ │(ECharts 饼折柱)│ │ (多维透视网格) │
  └────────┬─────────┘ └────────────────┘ └───────┬────────┘ └───────┬────────┘
           │                                      │                  │
           └──────────────────────────────────────┼──────────────────┘
                                                  │ onDrillDown (下钻事件)
                                                  ▼
                                        [ Transition to 'list' ]
                                        [ Append Group Domains ]
```

---

## 3. Core Component Manifest (核心组件名录)

| Component Path | Technical Foundation | Responsibility |
|---|---|---|
| `src/main.ts` | Vue 3 + Element Plus | Application boots, registers premium adapters, and injects global styles. |
| `src/auth/` | Session API (`/web/session`) | Handles secure credential exchange, login/logout, and hydrates allowed user companies. |
| `src/layout/` | HTML5 Flexbox + Odoo Bus | Renders the primary system Navbar, websocket notifications feed, and company switchers. |
| `src/workspace/MainWorkspace.ts` | Vue Render Function `h()` | The central orchestrator that manages active action states, reactive records collection, and views loading. |
| `src/workspace/OdooControlPanel.ts` | Element Plus Components | Renders the top-level faceted search box, pre-defined/custom filters, group-by categories, comparisons, and favorites. |
| `src/workspace/OdooSearchPanel.ts` | Element Plus `el-tree` | Sidebar classification tree that parses hierarchy from relational models and parent child mappings. |
| `src/widgets/` | Premium 3rd-party libs | Contains adapter components mapping records and view archs into ECharts, Frappe Gantt, VuePivottable, Leaflet, etc. |
