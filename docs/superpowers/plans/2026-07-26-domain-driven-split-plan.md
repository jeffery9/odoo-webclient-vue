# Domain-Driven Packages Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic `apps/web-client/src/main.ts` (23KB) into 4 domain-driven, decoupled packages (`auth/`, `layout/`, `workspace/`, and `main.ts` orchestrator) with 100% test compatibility.

**Architecture:** Domain subpackages host their respective reactive states and functional UI renderers, utilizing direct ESM imports to cleanly pass cross-package dependencies.

**Tech Stack:** TypeScript, Vue 3 reactivity & runtime renderer, Vite.

## Global Constraints
* Maintain 100% compatibility with existing Vitest test cases in `webclient.test.ts`.
* Do not introduce `.vue` files to avoid changing Vite bundler configs; use pure `.ts` files with standard Vue `h()` h-functions.
* Ensure all tests pass green in every step.

---

### Task 1: Scaffolding Domain Directories & Shared Authentication Package

**Files:**
* Create: `apps/web-client/src/auth/state.ts`
* Create: `apps/web-client/src/auth/LoginPortal.ts`

**Interfaces:**
* Produces: `isAuthenticated` (ref), `isConnecting` (ref), `activeClient` (ref), `persistSettings()`, `handleConnect()`, `handleAddonAutoLogin()`, `handleDisconnect()`
* Produces: `LoginPortal` functional component.

- [ ] **Step 1.1: Create Auth State Module**

Write the file `apps/web-client/src/auth/state.ts` to host all authenticator states and SSO hooks:
```typescript
import { ref } from 'vue';
import { RPCClient, SessionManager } from '@odoo/sdk';
import { getSavedConfig, saveConfig, isOdooAddonMode } from '../config.js';

const savedConfig = getSavedConfig();

export const isAuthenticated = ref(false);
export const isConnecting = ref(false);
export const isDevMode = ref(savedConfig.isDevMode);
export const hostUrl = ref(savedConfig.hostUrl);
export const dbName = ref(savedConfig.dbName);
export const username = ref(savedConfig.username);
export const password = ref(savedConfig.password);
export const activeClient = ref<RPCClient | null>(null);

export const persistSettings = () => {
  saveConfig({
    isDevMode: isDevMode.value,
    hostUrl: hostUrl.value,
    dbName: dbName.value,
    username: username.value,
    password: password.value,
  });
};

export const handleConnect = async (onSuccess: (client: RPCClient) => Promise<void>) => {
  if (isConnecting.value) return;
  isConnecting.value = true;
  try {
    const client = new RPCClient({ endpoint: hostUrl.value });
    const session = new SessionManager(client);
    await session.login(dbName.value, username.value, password.value);

    activeClient.value = client;
    isAuthenticated.value = true;
    persistSettings();

    await onSuccess(client);
  } catch (err: any) {
    alert('Failed to connect to Odoo backend: ' + err.message);
  } finally {
    isConnecting.value = false;
  }
};

export const handleAddonAutoLogin = async (onSuccess: (client: RPCClient) => Promise<void>) => {
  isConnecting.value = true;
  try {
    const relativeClient = new RPCClient({ endpoint: window.location.origin });
    await onSuccess(relativeClient);

    activeClient.value = relativeClient;
    isAuthenticated.value = true;
  } catch (err: any) {
    isAuthenticated.value = false;
  } finally {
    isConnecting.value = false;
  }
};

export const handleDisconnectCleanup = (onCleanup: () => void) => {
  isAuthenticated.value = false;
  activeClient.value = null;
  onCleanup();
};
```

- [ ] **Step 1.2: Create Login Portal View Component**

Write the file `apps/web-client/src/auth/LoginPortal.ts` to host the Login rendering container:
```typescript
import { h } from 'vue';
import {
  isAuthenticated,
  isConnecting,
  isDevMode,
  hostUrl,
  dbName,
  username,
  password,
  persistSettings,
} from './state.js';

export const LoginPortal = {
  name: 'LoginPortal',
  props: {
    onConnect: { type: Function, required: true },
  },
  setup(props: { onConnect: () => Promise<void> }) {
    return () => !isAuthenticated.value ? h('div', { class: 'o_modal_overlay' }, [
      h('div', { class: 'o_modal_box' }, [
        h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' }, [
          h('h3', { class: 'o_modal_title' }, 'Odoo Enterprise Connect'),
          h('button', {
            class: ['o_filter_btn', isDevMode.value ? 'active' : ''],
            onClick: () => { isDevMode.value = !isDevMode.value; persistSettings(); }
          }, 'Dev Settings')
        ]),

        isDevMode.value ? h('div', null, [
          h('div', { class: 'o_modal_field', style: 'margin-bottom: 12px;' }, [
            h('label', { class: 'o_modal_label' }, 'Server Endpoint'),
            h('input', { class: 'o_modal_input', value: hostUrl.value, onInput: (e: any) => { hostUrl.value = e.target.value; persistSettings(); } })
          ]),
          h('div', { class: 'o_modal_field', style: 'margin-bottom: 12px;' }, [
            h('label', { class: 'o_modal_label' }, 'Database'),
            h('input', { class: 'o_modal_input', value: dbName.value, onInput: (e: any) => { dbName.value = e.target.value; persistSettings(); } })
          ])
        ]) : null,

        h('div', { class: 'o_modal_field' }, [
          h('label', { class: 'o_modal_label' }, 'Username / Email'),
          h('input', { class: 'o_modal_input', value: username.value, onInput: (e: any) => { username.value = e.target.value; persistSettings(); } })
        ]),
        h('div', { class: 'o_modal_field', style: 'margin-top: 12px;' }, [
          h('label', { class: 'o_modal_label' }, 'Password'),
          h('input', { type: 'password', class: 'o_modal_input', value: password.value, onInput: (e: any) => { password.value = e.target.value; persistSettings(); } })
        ]),
        h('div', { style: 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;' }, [
          h('button', {
            class: 'o_btn_primary',
            disabled: isConnecting.value,
            onClick: props.onConnect
          }, isConnecting.value ? 'Authenticating...' : 'Sign In & Sync')
        ])
      ])
    ]) : null;
  }
};
```

---

### Task 2: Implementing Layout Package

**Files:**
* Create: `apps/web-client/src/layout/state.ts`
* Create: `apps/web-client/src/layout/ControlPanel.ts`

**Interfaces:**
* Produces: `menus` (ref), `activeMenu` (ref), `activeMenuName` (ref)
* Produces: `ControlPanel` component.

- [ ] **Step 2.1: Create Layout State Module**

Write `apps/web-client/src/layout/state.ts`:
```typescript
import { ref } from 'vue';

export const menus = ref<any[]>([]);
export const activeMenu = ref<any>(null);
export const activeMenuName = ref('');
```

- [ ] **Step 2.2: Create Control Panel Component**

Write `apps/web-client/src/layout/ControlPanel.ts`:
```typescript
import { h } from 'vue';
import { activeMenu, activeMenuName } from './state.js';

export const ControlPanel = {
  name: 'ControlPanel',
  props: {
    activeViewType: { type: String, required: true },
    selectedRecord: { type: Object, default: null },
    readonlyMode: { type: Boolean, required: true },
    searchQuery: { type: String, required: true },
    currentOffset: { type: Number, required: true },
    currentLimit: { type: Number, required: true },
    totalRecordsCount: { type: Number, required: true },
    onPageNext: { type: Function, required: true },
    onPagePrev: { type: Function, required: true },
    onSearchInput: { type: Function, required: true },
    onCreate: { type: Function, required: true },
    onToggleEdit: { type: Function, required: true },
    onSaveChanges: { type: Function, required: true },
    onDiscardChanges: { type: Function, required: true },
    onBackToList: { type: Function, required: true },
    onSetViewType: { type: Function, required: true }
  },
  setup(props: any) {
    return () => h('div', { class: 'o_control_panel' }, [
      h('div', { class: 'o_cp_left' }, [
        h('div', { class: 'o_breadcrumb' }, [
          h('span', { class: 'o_breadcrumb_link', onClick: props.onBackToList }, activeMenu.value?.name),
          h('span', { class: 'o_breadcrumb_separator' }, '/'),
          h('span', null, props.activeViewType === 'form' && props.selectedRecord ? (props.selectedRecord.get('name') || props.selectedRecord.get('display_name')) : activeMenuName.value)
        ]),
        h('div', { class: 'o_cp_buttons' }, [
          props.activeViewType !== 'form'
            ? h('button', { class: 'o_btn_primary', onClick: props.onCreate }, 'New')
            : h('div', { style: 'display: flex; gap: 8px;' }, [
                props.readonlyMode
                  ? h('button', { class: 'o_btn_primary', onClick: props.onToggleEdit }, 'Edit')
                  : h('button', { class: 'o_btn_primary', onClick: props.onSaveChanges }, 'Save'),
                !props.readonlyMode
                  ? h('button', { class: 'o_btn_secondary', onClick: props.onDiscardChanges }, 'Discard')
                  : h('button', { class: 'o_btn_secondary', onClick: props.onBackToList }, 'Back to List')
              ])
        ])
      ]),

      h('div', { class: 'o_cp_right' }, [
        h('div', { style: 'display: flex; gap: 16px; align-items: center;' }, [
          props.activeViewType !== 'form' ? h('div', { class: 'o_pager' }, [
            h('span', { class: 'o_pager_value' }, `${props.currentOffset + 1}-${Math.min(props.currentOffset + props.currentLimit, props.totalRecordsCount)}`),
            h('span', null, '/'),
            h('span', null, props.totalRecordsCount),
            h('button', { class: 'o_pager_btn', disabled: props.currentOffset === 0, onClick: props.onPagePrev }, '‹'),
            h('button', { class: 'o_pager_btn', disabled: props.currentOffset + props.currentLimit >= props.totalRecordsCount, onClick: props.onPageNext }, '›')
          ]) : null,

          props.activeViewType !== 'form' ? h('div', { class: 'o_cp_searchview' }, [
            h('span', null, '🔍'),
            h('input', {
              class: 'o_cp_searchview_input',
              placeholder: `Search ${activeMenu.value?.name || 'Records'}...`,
              value: props.searchQuery,
              onInput: (e: any) => props.onSearchInput(e.target.value)
            })
          ]) : null,

          h('div', { class: 'o_cp_switch_buttons' }, [
            h('button', { class: ['o_switch_btn', props.activeViewType === 'list' ? 'active' : ''], onClick: () => props.onSetViewType('list') }, 'List ☰'),
            h('button', { class: ['o_switch_btn', props.activeViewType === 'kanban' ? 'active' : ''], onClick: () => props.onSetViewType('kanban') }, 'Kanban ⚃'),
            h('button', { class: ['o_switch_btn', props.activeViewType === 'form' ? 'active' : ''], disabled: !props.selectedRecord, onClick: () => props.onSetViewType('form') }, 'Form ▭')
          ])
        ])
      ])
    ]);
  }
};
```

---

### Task 3: Implementing Workspace Package

**Files:**
* Create: `apps/web-client/src/workspace/state.ts`
* Create: `apps/web-client/src/workspace/actions.ts`
* Create: `apps/web-client/src/workspace/MainWorkspace.ts`

**Interfaces:**
* Produces: `partnerRecords` (reactive), `activeAction` (ref), `activeContext` (ref), `activeViewType` (ref), `selectedRecord` (ref), `readonlyMode` (ref), `listArch`, `formArch`, `kanbanArch`, `currentOffset`, `currentLimit`, `totalRecordsCount`, `searchQuery`
* Produces: `executeAction`, `handleCreate`, `saveChanges`, `discardChanges` handlers.
* Produces: `MainWorkspace` functional view component.

- [ ] **Step 3.1: Create Workspace State Module**

Write `apps/web-client/src/workspace/state.ts`:
```typescript
import { ref, reactive, computed } from 'vue';
import { RecordProxy } from '@odoo/sdk';

export const partnerRecords = reactive<RecordProxy[]>([]);
export const activeAction = ref<any>(null);
export const activeContext = ref<Record<string, any>>({});
export const activeViewType = ref<'list' | 'kanban' | 'form'>('list');
export const selectedRecord = ref<RecordProxy | null>(null);
export const readonlyMode = ref(true);

export const currentOffset = ref(0);
export const currentLimit = ref(20);
export const totalRecordsCount = ref(0);
export const searchQuery = ref('');

export const listArch = ref<any>({ type: 'list', children: [] });
export const formArch = ref<any>({ type: 'form', children: [] });
export const kanbanArch = ref<any>({ type: 'kanban', children: [] });

export const filteredRecords = computed(() => {
  if (!searchQuery.value) return partnerRecords;
  const q = searchQuery.value.toLowerCase();
  return partnerRecords.filter(r => {
    const name = (r.get('name') || '').toLowerCase();
    const email = (r.get('email') || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });
});
```

- [ ] **Step 3.2: Create Workspace Actions Module**

Write `apps/web-client/src/workspace/actions.ts`:
```typescript
import { RecordProxy, ArchCompiler, Context } from '@odoo/sdk';
import { activeClient, isConnecting } from '../auth/state.js';
import {
  partnerRecords,
  activeAction,
  activeContext,
  activeViewType,
  selectedRecord,
  readonlyMode,
  currentOffset,
  currentLimit,
  totalRecordsCount,
  listArch,
  formArch,
  kanbanArch
} from './state.js';

export const executeAction = async (actionId: number, options?: { resetOffset?: boolean }) => {
  if (!activeClient.value) return;
  isConnecting.value = true;
  if (options?.resetOffset) {
    currentOffset.value = 0;
  }

  try {
    const action = await activeClient.value.loadAction(actionId);
    if (!action || !action.res_model) {
      throw new Error(`Odoo action ${actionId} specifies no valid model.`);
    }
    const model = action.res_model;

    const evaluatedContext = Context.merge(
      [action.context],
      { uid: (activeClient.value as any).uid || 1 }
    );
    activeContext.value = evaluatedContext;

    const viewsToLoad: [number | boolean, string][] = action.views || [[false, 'list'], [false, 'form'], [false, 'kanban']];
    const viewsResponse = await activeClient.value.loadViews(model, viewsToLoad);
    const viewsMap = viewsResponse?.fields_views || {};

    const rawListXml = viewsMap.list?.arch || viewsMap.tree?.arch || '';
    const rawFormXml = viewsMap.form?.arch || '';
    const rawKanbanXml = viewsMap.kanban?.arch || '';

    const domain = action.domain || [];
    totalRecordsCount.value = await activeClient.value.call(model, 'search_count', [domain], { context: activeContext.value });

    const fieldsToSelect: string[] = ['name', 'active'];
    const recordsData = await activeClient.value.search_read(
      model,
      domain,
      fieldsToSelect,
      currentLimit.value,
      currentOffset.value,
      activeContext.value
    );

    activeAction.value = action;

    if (rawListXml) listArch.value = ArchCompiler.compile(rawListXml);
    if (rawFormXml) formArch.value = ArchCompiler.compile(rawFormXml);
    if (rawKanbanXml) kanbanArch.value = ArchCompiler.compile(rawKanbanXml);

    const proxies = recordsData.map((d: any) => new RecordProxy(model, d, activeClient.value!));
    partnerRecords.splice(0, partnerRecords.length, ...proxies);
    selectedRecord.value = partnerRecords[0] || null;
  } catch (err: any) {
    alert('Odoo Dynamic Loader Error: ' + err.message);
  } finally {
    isConnecting.value = false;
  }
};

export const handleCreate = () => {
  const model = activeAction.value?.res_model || 'res.partner';
  const defaultValues: Record<string, any> = {};
  if (activeContext.value) {
    for (const [key, value] of Object.entries(activeContext.value)) {
      if (key.startsWith('default_')) {
        const fieldName = key.substring(8);
        defaultValues[fieldName] = value;
      }
    }
  }

  if (activeClient.value) {
    selectedRecord.value = new RecordProxy(
      model,
      { id: null, name: 'New Record', ...defaultValues },
      activeClient.value
    );
  }
  activeViewType.value = 'form';
  readonlyMode.value = false;
};

export const saveChanges = async () => {
  try {
    if (selectedRecord.value) {
      const isNew = selectedRecord.value.id === null;
      await selectedRecord.value.save(activeContext.value);
      if (isNew) {
        partnerRecords.push(selectedRecord.value);
      }
    }
    readonlyMode.value = true;
  } catch (err: any) {
    alert('Odoo Backend Save Error: ' + err.message);
  }
};

export const discardChanges = () => {
  if (selectedRecord.value) {
    selectedRecord.value.discard();
  }
  readonlyMode.value = true;
};
```

- [ ] **Step 3.3: Create Main Workspace Component**

Write `apps/web-client/src/workspace/MainWorkspace.ts`:
```typescript
import { h } from 'vue';
import { ListRenderer, FormRenderer } from '@odoo/vue-runtime';
import { RecordProxy } from '@odoo/sdk';
import { activeMenu } from '../layout/state.js';
import { isConnecting } from '../auth/state.js';
import {
  activeViewType,
  selectedRecord,
  readonlyMode,
  filteredRecords,
  listArch,
  formArch
} from './state.js';

export const MainWorkspace = {
  name: 'MainWorkspace',
  props: {
    onSelectRecord: { type: Function, required: true }
  },
  setup(props: { onSelectRecord: (rec: RecordProxy) => void }) {
    return () => h('div', { class: 'o_action_manager' }, [
      // Left Navigation Subsection Sidebar
      activeMenu.value?.subsections ? h('aside', { class: 'o_sidebar' }, [
        activeMenu.value.subsections.map((section: any) => h('div', { class: 'o_sidebar_section' }, [
          h('div', { class: 'o_sidebar_section_title' }, section.title),
          section.items.map((item: any) => h('a', {
            class: ['o_sidebar_link', activeViewType.value === 'list' ? 'active' : ''],
            onClick: () => props.onSelectRecord(item)
          }, item.name))
        ]))
      ]) : null,

      // Right Main View Container
      h('div', { style: 'flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;' }, [
        h('main', { class: 'o_content' }, [
          isConnecting.value ? h('div', { style: 'display: flex; justify-content: center; align-items: center; height: 100%; color: #666;' }, 'Synchronizing backend data...') : null,

          // List Rendering
          !isConnecting.value && activeViewType.value === 'list' ? h('div', null, [
            h(ListRenderer, {
              arch: listArch.value,
              records: filteredRecords.value,
              onClick: (e: any) => {
                const tr = e.target.closest('tr');
                if (tr) {
                  const index = Array.from(tr.parentNode.children).indexOf(tr);
                  if (index >= 0) props.onSelectRecord(filteredRecords.value[index]);
                }
              }
            })
          ]) : null,

          // Kanban (Card) Rendering
          !isConnecting.value && activeViewType.value === 'kanban' ? h('div', { class: 'o_kanban_view' }, 
            filteredRecords.value.map(rec => h('div', {
              class: 'o_kanban_record',
              onClick: () => props.onSelectRecord(rec)
            }, [
              h('div', { class: 'o_kanban_title' }, rec.get('name') || rec.get('display_name')),
              h('div', { class: 'o_kanban_subtitle' }, rec.get('email') || rec.get('customer') || rec.get('product') || '')
            ]))
          ) : null,

          // Form Rendering
          !isConnecting.value && activeViewType.value === 'form' && selectedRecord.value ? h('div', { class: 'o_form_sheet_bg' }, [
            h('div', { class: 'o_form_sheet' }, [
              h(FormRenderer, {
                arch: formArch.value,
                record: selectedRecord.value,
                readonly: readonlyMode.value
              })
            ])
          ]) : null
        ])
      ])
    ]);
  }
};
```

---

### Task 4: Rewriting the Central Orchestrator & Bootstrapping

**Files:**
* Modify: `apps/web-client/src/main.ts`

**Interfaces:**
* Consumes: all exports from `auth/`, `layout/`, and `workspace/` packages.

- [ ] **Step 4.1: Refactor `apps/web-client/src/main.ts`**

Rewrite `apps/web-client/src/main.ts` to cleanly import, orchestrate, hook router, and mount the App:
```typescript
import { createApp, h, onMounted } from 'vue';
import { RecordProxy, HashRouter, RPCClient } from '@odoo/sdk';
import { isOdooAddonMode } from './config.js';

// Domain imports
import {
  isAuthenticated,
  isConnecting,
  isDevMode,
  persistSettings,
  handleConnect,
  handleAddonAutoLogin,
  handleDisconnectCleanup,
  activeClient,
} from './auth/state.js';
import { LoginPortal } from './auth/LoginPortal.js';

import {
  menus,
  activeMenu,
  activeMenuName,
} from './layout/state.js';
import { ControlPanel } from './layout/ControlPanel.js';

import {
  partnerRecords,
  activeAction,
  activeContext,
  activeViewType,
  selectedRecord,
  readonlyMode,
  currentOffset,
  currentLimit,
  totalRecordsCount,
  searchQuery,
  listArch,
  formArch,
  kanbanArch,
} from './workspace/state.js';
import {
  executeAction,
  handleCreate,
  saveChanges,
  discardChanges,
} from './workspace/actions.js';
import { MainWorkspace } from './workspace/MainWorkspace.js';

// Setup Router
const router = new HashRouter();

const App = {
  name: 'App',
  setup() {
    // Dynamic menu bootstrapping
    const bootstrapMenus = async (client: RPCClient) => {
      const [odooMenus] = await Promise.all([
        client.loadMenus(),
        client.loadTranslations('en_US'),
      ]);

      const rootMenu = odooMenus?.root || {};
      const parsedApps: any[] = [];

      if (rootMenu.children) {
        for (const mid of rootMenu.children) {
          const m = odooMenus[mid];
          if (m) {
            let actId = m.actionID || m.action_id || m.action;
            if (typeof actId === 'string') {
              const matched = actId.match(/\d+/);
              if (matched) actId = Number(matched[0]);
            }
            const subsections = m.children?.map((smid: number) => {
              const sub = odooMenus[smid];
              return {
                title: sub.name,
                items: sub.children?.map((subsubid: number) => {
                  const subsub = odooMenus[subsubid];
                  let subActId = subsub.actionID || subsub.action_id || subsub.action;
                  if (typeof subActId === 'string') {
                    const matched = subActId.match(/\d+/);
                    if (matched) subActId = Number(matched[0]);
                  }
                  return {
                    name: subsub.name,
                    actionID: subActId,
                  };
                }) || [],
              };
            }) || [];

            parsedApps.push({
              id: mid,
              name: m.name,
              actionID: actId,
              subsections,
            });
          }
        }
      }

      menus.value = parsedApps;
      if (parsedApps.length > 0) {
        await selectApp(parsedApps[0]);
      }
    };

    const handleConnectTrigger = async () => {
      await handleConnect(bootstrapMenus);
    };

    const handleDisconnect = () => {
      handleDisconnectCleanup(() => {
        menus.value = [];
        activeMenu.value = null;
        activeAction.value = null;
        partnerRecords.splice(0, partnerRecords.length);
      });
    };

    const selectApp = async (app: any) => {
      activeMenu.value = app;
      activeViewType.value = 'list';
      currentOffset.value = 0;

      const firstSectionItem = app.subsections?.[0]?.items?.[0];
      const actionToLoad = firstSectionItem ? firstSectionItem.actionID : app.actionID;
      activeMenuName.value = firstSectionItem ? firstSectionItem.name : app.name;

      if (actionToLoad) {
        await executeAction(actionToLoad, { resetOffset: true });
      }
    };

    const selectSubmenu = async (item: { name: string; actionID: number }) => {
      activeMenuName.value = item.name;
      activeViewType.value = 'list';
      await executeAction(item.actionID, { resetOffset: true });
    };

    const selectPartner = (rec: RecordProxy) => {
      selectedRecord.value = rec;
      activeViewType.value = 'form';
      readonlyMode.value = true;
      syncStateToHash();
    };

    const setViewType = (mode: 'list' | 'kanban' | 'form') => {
      activeViewType.value = mode;
      if (mode === 'list') {
        readonlyMode.value = true;
      }
      syncStateToHash();
    };

    const syncStateToHash = () => {
      const params: Record<string, string> = {
        menu_id: activeMenu.value?.id || '',
        action: activeAction.value?.id || '',
        view_type: activeViewType.value,
        offset: String(currentOffset.value),
        limit: String(currentLimit.value),
      };
      if (activeViewType.value === 'form' && selectedRecord.value) {
        params.id = String(selectedRecord.value.id || '');
      }
      router.setParams(params);
    };

    const handleHashNavigation = async (params: Record<string, string>) => {
      if (params.menu_id) {
        const menuId = Number(params.menu_id);
        const found = menus.value.find(m => m.id === menuId);
        if (found && found !== activeMenu.value) {
          activeMenu.value = found;
        }
      }
      if (params.offset) {
        currentOffset.value = Number(params.offset);
      }
      if (params.view_type) {
        activeViewType.value = params.view_type as any;
      }
      if (params.id && partnerRecords.length > 0) {
        const recordId = Number(params.id);
        const found = partnerRecords.find(r => r.id === recordId);
        if (found) {
          selectedRecord.value = found;
        }
      }
    };

    const handlePageNext = async () => {
      if (currentOffset.value + currentLimit.value < totalRecordsCount.value) {
        currentOffset.value += currentLimit.value;
        await executeAction(activeAction.value?.id || activeMenu.value.actionID);
      }
    };

    const handlePagePrev = async () => {
      if (currentOffset.value - currentLimit.value >= 0) {
        currentOffset.value -= currentLimit.value;
        await executeAction(activeAction.value?.id || activeMenu.value.actionID);
      }
    };

    onMounted(async () => {
      const initialParams = router.getParams();
      if (Object.keys(initialParams).length > 0) {
        await handleHashNavigation(initialParams);
      }
      router.onNavigate(handleHashNavigation);

      if (isOdooAddonMode()) {
        isDevMode.value = false;
        await handleAddonAutoLogin(bootstrapMenus);
      }
    });

    return () => h('div', { style: 'height: 100%; display: flex; flex-direction: column;' }, [
      // Navbar Component
      h('header', { class: 'o_main_navbar' }, [
        h('div', { class: 'o_navbar_left' }, [
          h('div', { class: 'o_menu_brand' }, '☰ Apps'),
          isAuthenticated.value ? h('nav', { class: 'o_navbar_apps' }, 
            menus.value.map(m => h('a', {
              class: ['o_nav_link', activeMenu.value?.id === m.id ? 'active' : ''],
              onClick: () => selectApp(m)
            }, m.name))
          ) : null
        ]),
        h('div', { class: 'o_navbar_right' }, [
          isAuthenticated.value
            ? h('button', { class: 'o_connect_btn connected', onClick: handleDisconnect }, '🟢 Connected')
            : null,
          isAuthenticated.value ? h('span', { style: 'font-weight: 500; margin-left: 10px;' }, 'Administrator') : null,
          isAuthenticated.value ? h('div', { class: 'o_user_avatar' }, 'A') : null
        ])
      ]),

      // Login Portal
      !isAuthenticated.value ? h(LoginPortal, { onConnect: handleConnectTrigger }) : null,

      // Main Content Area
      isAuthenticated.value ? h('div', { style: 'flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;' }, [
        // Control Panel
        h(ControlPanel, {
          activeViewType: activeViewType.value,
          selectedRecord: selectedRecord.value,
          readonlyMode: readonlyMode.value,
          searchQuery: searchQuery.value,
          currentOffset: currentOffset.value,
          currentLimit: currentLimit.value,
          totalRecordsCount: totalRecordsCount.value,
          onPageNext: handlePageNext,
          onPagePrev: handlePagePrev,
          onSearchInput: (val: string) => { searchQuery.value = val; },
          onCreate: handleCreate,
          onToggleEdit: () => { readonlyMode.value = !readonlyMode.value; },
          onSaveChanges: saveChanges,
          onDiscardChanges: discardChanges,
          onBackToList: () => { activeViewType.value = 'list'; readonlyMode.value = true; },
          onSetViewType: setViewType
        }),

        // Workspace Render Grid
        h(MainWorkspace, {
          onSelectRecord: (rec: any) => {
            if (rec.actionID) {
              selectSubmenu(rec);
            } else {
              selectPartner(rec);
            }
          }
        })
      ]) : null
    ]);
  }
};

createApp(App).mount('#app');
```

---

### Task 5: Verification & Cleanup

**Files:**
* Test: `apps/web-client/src/webclient.test.ts`

- [ ] **Step 5.1: Run Build and Type-checking**

Run: `npm run build`  
Expected: PASS with 0 TSC/Vite compiler errors.

- [ ] **Step 5.2: Execute entire Vitest workspace test suite**

Run: `npx vitest run`  
Expected: All 74 assertions pass green.

- [ ] **Step 5.3: Commit and lock history**

```bash
git add apps/web-client/src
git commit -m "refactor(web-client): split monolithic main.ts into domain-driven layout, auth, and workspace packages"
```
