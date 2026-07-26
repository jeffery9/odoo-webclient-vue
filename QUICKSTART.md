# Odoo Custom Web Client - Developer Quick Start Guide

This guide describes how to compile, run, test, and deploy the `@odoo/client-sdk` Monorepo.

---

## 🛠️ 1. Installation & Monorepo Initialization

The project is structured as an NPM workspaces Monorepo. Make sure you have **Node.js (v18+)** and **NPM** installed.

```bash
# Clone the repository (if not already done)
git clone https://github.com/jeffery9/odoo-webclient-vue.git
cd odoo-webclient-vue

# Install dependencies and link workspace packages
npm install
```

---

## 🏗️ 2. Build & Compiling

Compile all TypeScript packages and build the Single Page Application assets.

```bash
# Build all workspaces (SDK core, Vue runtime, and Web Client)
npm run build
```

This compiles:
*   `@odoo/sdk` inside `packages/sdk/dist/`
*   `@odoo/vue-runtime` inside `packages/vue-runtime/dist/`
*   `apps/web-client` inside `apps/web-client/dist/` (static HTML/JS/CSS assets)

---

## 🧪 3. Running Unit Tests

Our entire codebase is secured with Vitest unit tests.

```bash
# Run all unit tests once
npm run test

# Or run tests in watch mode (interactive)
npx vitest
```

---

## 🚀 4. Local Development (Vite Proxy Sandbox)

To develop against a running Odoo instance (e.g., Odoo 19 Enterprise/Community running locally on port 8069), use our built-in CORS bypass proxy.

### Step 1: Configure the Target Odoo Server
Create an `.env` file or set the environment variables in `apps/web-client/`:

```bash
# Target backend endpoint (Vite proxy redirects /web requests here)
VITE_ODOO_ENDPOINT=http://localhost:8069
```

### Step 2: Launch the Dev Server
```bash
# Start Vite development dev server
npm run dev --workspace=apps/web-client
```

Now open **`http://localhost:5173`** in your browser. You can select your database, enter your Odoo credentials, and run the alternative web client side-by-side with your standard Odoo backend!

---

## 📦 5. Native Odoo Addon Deployment

To install this custom client inside an Odoo database as a native alternative Web Client (hosted directly by Odoo's web server):

1.  Create an Odoo Addon folder (e.g. `alternative_web_client`) under your custom addons path.
2.  Copy your compiled SPA assets from `apps/web-client/dist/` into the addon's static directory:
    ```bash
    mkdir -p alternative_web_client/static/src/dist
    cp -r apps/web-client/dist/* alternative_web_client/static/src/dist/
    ```
3.  Implement a custom Python HTTP Controller and QWeb entry template (refer to the full instructions in `ARCHITECTURE.md`).
4.  Restart your Odoo server, update the apps list, and click **Install**. You can now access your new web client natively at `/my/webclient` with **Zero-Config SSO (Single Sign-On)**!
