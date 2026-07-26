# Odoo Web Client Vue (`odoo-webclient-vue`)

[![Vitest Unit Tests](https://img.shields.io/badge/Vitest-104%2F104%20Passed-brightgreen)](https://github.com/jeffery9/odoo-webclient-vue)
[![Framework](https://img.shields.io/badge/Framework-Vue%203-4fc08d)](https://vuejs.org/)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Odoo Version](https://img.shields.io/badge/Odoo-v16%20--%20v19%20EE%2FCE-714B67)](https://www.odoo.com/)

A premium, enterprise-grade, alternative Web Client for Odoo built from first principles using **Vue 3, TypeScript, and TailwindCSS**. 

This project compiles standard Odoo XML view architectures and QWeb templates into an **Ahead-Of-Time (AOT) Semantic JSON IR**, delivering a ultra-fast, zero-DOM-recalculation, and highly extensible ERP client-side experience.

---

## 🌟 Key Highlights & Architectural Advantages

*   **Controller-less MVVM Architecture**
    *   Eliminates complex django-like or backbone controller states.
    *   Uses reactive **`RecordProxy`** wrappers directly inside the host framework's reactivity engine (Vue reactive refs) as the physical data sink, achieving real-time data binding.
*   **Ahead-Of-Time (AOT) View Compilation**
    *   No heavy XML parser running in the user's browser.
    *   All raw Odoo XML views and QWeb templates compile cleanly into high-performance, structured JSON ASTs.
*   **High-Fidelity Odoo RNG Semantics**
    *   Implements `<sheet>` card layouts, `<header>` statusbar flow, and responsive nested `<group>` layouts using modern CSS Grid and automatic label bindings.
    *   Upgraded Odoo 19 inline Python modifier engines for fields (`invisible`, `readonly`, `required`).
*   **Advanced Analytics & Renderers Included**
    *   **Graph Renderer**: Responsive Bar, Line, and Pie charts using `echarts`.
    *   **Pivot Renderer**: Cross-tab drag-and-drop analytics using `vue-pivottable`.
    *   **Map Renderer**: Interactive map markers with automatic clustering powered by `Leaflet`.
    *   **Gantt Renderer**: Timeline task progress visualizations via `frappe-gantt`.
    *   **QWeb Renderer**: Dynamic evaluation of `t-if`, `t-foreach`, `t-esc`, and local scope bindings.
*   **Native Odoo Addon Compatibility**
    *   Can be compiled and placed inside a native Odoo module directory.
    *   Includes automatic Single Sign-On (SSO) context and CSRF token injection from the Odoo backend session, requiring **zero login configurations** when installed!

---

## 📂 Monorepo Structure

```
odoo-webclient-vue/
├── packages/
│   ├── sdk/                # Core Odoo SDK (RPC, Domain parsing, Modifiers, Context, Session)
│   └── vue-runtime/        # Vue view renderers, widget component registry, QWeb engine
├── apps/
│   └── web-client/         # Root SPA app shell (Vite proxy config, state, tailwind themes)
├── TODO.md                 # Master Open Source Roadmap (Phases 1-12)
├── QUICKSTART.md           # Step-by-step installation, compilation, and dev setup
└── ARCHITECTURE.md         # In-depth architectural design guidelines
```

---

## 🚀 Quick Start & Development

We support a **dual-boot setup** allowing you to either develop in a sandboxed local Vite proxy server or package and deploy directly into a production Odoo addon.

### Quick Start (NPM Workspaces)

```bash
# Clone the repository
git clone https://github.com/jeffery9/odoo-webclient-vue.git
cd odoo-webclient-vue

# Install and bootstrap the workspaces
npm install

# Run unit tests (104 tests passing!)
npm run test

# Compile and build production assets
npm run build
```

*For more details on connecting to a live Odoo database, running Vite dev proxy servers, and packaging assets, please refer to our **[Developer Quick Start Guide](./QUICKSTART.md)**.*

---

## 🗺️ Roadmap & Contributing

The master roadmap for this project is hosted directly in **[TODO.md](./TODO.md)**. We are currently implementing **Phase 7 (Layout Semantic Alignment)** and **Phase 8 (View State & Controls)**. 

We warmly welcome contributions! Please read our quickstart guidelines and submit Pull Requests for any unchecked items in the `TODO.md` backlog.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
