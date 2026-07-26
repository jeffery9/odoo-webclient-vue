import { createApp, h, reactive, ref, computed, onMounted } from 'vue';
import { RecordProxy, HashRouter, RPCClient, SessionManager, ArchCompiler } from '@odoo/sdk';
import { ListRenderer, FormRenderer } from '@odoo/vue-runtime';
import { getSavedConfig, saveConfig, isOdooAddonMode } from './config.js';

// ==========================================
// 1. Reactive Web Client State (100% Dynamic)
// ==========================================
const savedConfig = getSavedConfig();

const isAuthenticated = ref(false);
const isConnecting = ref(false);
const menus = ref<any[]>([]);
const activeMenu = ref<any>(null);
const activeMenuName = ref('');
const activeAction = ref<any>(null);

const partnerRecords = reactive<RecordProxy[]>([]);
const activeViewType = ref<'list' | 'kanban' | 'form'>('list');
const selectedRecord = ref<RecordProxy | null>(null);
const readonlyMode = ref(true);
const searchQuery = ref('');
const activeFilter = ref<'all' | 'active'>('all');

// Developer & Connection configurations
const isDevMode = ref(savedConfig.isDevMode);
const hostUrl = ref(savedConfig.hostUrl);
const dbName = ref(savedConfig.dbName);
const username = ref(savedConfig.username);
const password = ref(savedConfig.password);
const activeClient = ref<RPCClient | null>(null);

// Control Panel Pagination
const currentOffset = ref(0);
const currentLimit = ref(20);
const totalRecordsCount = ref(0);

// View architectures (Dynamic IR compiles from Odoo Server)
const listArch = ref<any>({ type: 'list', children: [] });
const formArch = ref<any>({ type: 'form', children: [] });
const kanbanArch = ref<any>({ type: 'kanban', children: [] });

// 2. Instantiate HashRouter
const router = new HashRouter(window.location);

// ==========================================
// 3. Create App Component
// ==========================================
const App = {
  setup() {
    const filteredRecords = computed(() => {
      return partnerRecords.filter(rec => {
        const nameVal = rec.get('name') || rec.get('display_name') || '';
        const matchesSearch = String(nameVal).toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesFilter = activeFilter.value === 'all' || rec.get('active') !== false;
        return matchesSearch && matchesFilter;
      });
    });

    const persistSettings = () => {
      saveConfig({
        isDevMode: isDevMode.value,
        hostUrl: hostUrl.value,
        dbName: dbName.value,
        username: username.value,
        password: password.value
      });
    };

    const syncStateToHash = () => {
      const params: Record<string, string | number> = {
        menu_id: activeMenu.value ? activeMenu.value.id : '',
        view_type: activeViewType.value,
        offset: currentOffset.value
      };
      if (activeViewType.value === 'form' && selectedRecord.value) {
        params.id = selectedRecord.value.id || '';
      }
      router.setParams(params);
    };

    // Load Odoo views & data dynamically
    const executeAction = async (actionId: number, options?: { resetOffset?: boolean }) => {
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

        const viewsToLoad: [number | boolean, string][] = action.views || [[false, 'list'], [false, 'form'], [false, 'kanban']];
        const viewsResponse = await activeClient.value.loadViews(model, viewsToLoad);
        const viewsMap = viewsResponse?.fields_views || {};

        const rawListXml = viewsMap.list?.arch || viewsMap.tree?.arch || '';
        const rawFormXml = viewsMap.form?.arch || '';
        const rawKanbanXml = viewsMap.kanban?.arch || '';

        const domain = action.domain || [];
        totalRecordsCount.value = await activeClient.value.call(model, 'search_count', [domain], {});

        const fieldsToSelect: string[] = ['name', 'active'];
        const recordsData = await activeClient.value.search_read(
          model,
          domain,
          fieldsToSelect,
          currentLimit.value,
          currentOffset.value
        );

        activeAction.value = action;

        if (rawListXml) listArch.value = ArchCompiler.compile(rawListXml);
        if (rawFormXml) formArch.value = ArchCompiler.compile(rawFormXml);
        if (rawKanbanXml) kanbanArch.value = ArchCompiler.compile(rawKanbanXml);

        const proxies = recordsData.map((d: any) => new RecordProxy(model, d, activeClient.value!));
        partnerRecords.splice(0, partnerRecords.length, ...proxies);
        selectedRecord.value = partnerRecords[0] || null;

        syncStateToHash();
      } catch (err: any) {
        alert('Odoo Dynamic Loader Error: ' + err.message);
      } finally {
        isConnecting.value = false;
      }
    };

    const selectPartner = (rec: RecordProxy) => {
      selectedRecord.value = rec;
      activeViewType.value = 'form';
      readonlyMode.value = true;
      syncStateToHash();
    };

    const setViewType = (view: 'list' | 'kanban' | 'form') => {
      activeViewType.value = view;
      syncStateToHash();
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

    // Load enterprise menu map
    const bootstrapMenus = async (client: RPCClient) => {
      // Load Menus and Translations concurrently to match the exact Odoo network boot footprint!
      const [odooMenus, translations] = await Promise.all([
        client.loadMenus(),
        client.loadTranslations('en_US')
      ]);

      const rootMenu = odooMenus?.root || {};
      const parsedApps: any[] = [];

      if (rootMenu.children) {
        for (const mid of rootMenu.children) {
          const m = odooMenus[mid];
          if (m) {
            let actId = m.actionID || m.action_id || m.action;
            if (typeof actId === 'string') {
              const parts = actId.split(',');
              actId = Number(parts[parts.length - 1]);
            }

            const subsections: any[] = [];
            if (m.children && m.children.length > 0) {
              const groupItems: any[] = [];
              for (const subId of m.children) {
                const subMenu = odooMenus[subId];
                if (subMenu) {
                  let subActId = subMenu.actionID || subMenu.action_id || subMenu.action;
                  if (typeof subActId === 'string') {
                    const parts = subActId.split(',');
                    subActId = Number(parts[parts.length - 1]);
                  }
                  if (subActId) {
                    groupItems.push({ name: subMenu.name, actionID: subActId });
                  }
                }
              }
              if (groupItems.length > 0) {
                subsections.push({ title: m.name, items: groupItems });
              }
            }

            parsedApps.push({
              id: m.id,
              name: m.name,
              icon: m.name.charAt(0).toUpperCase(),
              color: '#71639e',
              actionID: actId || null,
              subsections: subsections.length > 0 ? subsections : undefined
            });
          }
        }
      }

      if (parsedApps.length > 0) {
        menus.value = parsedApps;
        await selectApp(parsedApps[0]);
      }
    };

    // Authenticate and connect
    const handleConnect = async () => {
      isConnecting.value = true;
      try {
        const client = new RPCClient({ endpoint: hostUrl.value });
        const session = new SessionManager(client);
        await session.login(dbName.value, username.value, password.value);
        
        activeClient.value = client;
        isAuthenticated.value = true;
        persistSettings();

        await bootstrapMenus(client);
      } catch (err: any) {
        alert('Failed to connect to Odoo backend: ' + err.message);
      } finally {
        isConnecting.value = false;
      }
    };

    // Attempt passwordless SSO boot when embedded in real Odoo Addon (Same-origin cookies)
    const handleAddonAutoLogin = async () => {
      isConnecting.value = true;
      try {
        // In Odoo Addon mode, the cookies are already active. Just call relative load_menus!
        const relativeClient = new RPCClient({ endpoint: window.location.origin });
        await bootstrapMenus(relativeClient);
        
        activeClient.value = relativeClient;
        isAuthenticated.value = true;
      } catch (err: any) {
        // If SSO cookie is missing/expired, fall back to showing the connect modal
        isAuthenticated.value = false;
      } finally {
        isConnecting.value = false;
      }
    };

    const handleDisconnect = () => {
      isAuthenticated.value = false;
      activeClient.value = null;
      menus.value = [];
      activeMenu.value = null;
      activeAction.value = null;
      partnerRecords.splice(0, partnerRecords.length);
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

    const handleCreate = () => {
      const model = activeAction.value?.res_model || 'res.partner';
      if (activeClient.value) {
        selectedRecord.value = new RecordProxy(model, { id: null, name: 'New Record' }, activeClient.value);
      }
      activeViewType.value = 'form';
      readonlyMode.value = false;
      syncStateToHash();
    };

    const toggleEdit = () => {
      readonlyMode.value = !readonlyMode.value;
    };

    const saveChanges = async () => {
      try {
        if (selectedRecord.value?.client) {
          const isNew = selectedRecord.value.id === null;
          await selectedRecord.value.save();
          if (isNew) {
            partnerRecords.push(selectedRecord.value);
          }
        }
        readonlyMode.value = true;
      } catch (err: any) {
        alert('Odoo Backend Save Error: ' + err.message);
      }
    };

    const discardChanges = () => {
      if (selectedRecord.value) {
        selectedRecord.value.discard();
      }
      readonlyMode.value = true;
    };

    const selectSubmenu = async (item: { name: string; actionID: number }) => {
      activeMenuName.value = item.name;
      activeViewType.value = 'list';
      await executeAction(item.actionID, { resetOffset: true });
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

    onMounted(async () => {
      const initialParams = router.getParams();
      if (Object.keys(initialParams).length > 0) {
        await handleHashNavigation(initialParams);
      }
      router.onNavigate(handleHashNavigation);

      // Auto SSO Trigger in production module
      if (isOdooAddonMode()) {
        isDevMode.value = false;
        await handleAddonAutoLogin();
      }
    });

    return () => h('div', { style: 'height: 100%; display: flex; flex-direction: column;' }, [
      // 1. Top Navbar
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

      // 2. Clean Login Page (If Unauthenticated)
      !isAuthenticated.value ? h('div', { class: 'o_modal_overlay' }, [
        h('div', { class: 'o_modal_box' }, [
          h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' }, [
            h('h3', { class: 'o_modal_title' }, 'Odoo Enterprise Connect'),
            // Developer mode toggles inside connection portal!
            h('button', {
              class: ['o_filter_btn', isDevMode.value ? 'active' : ''],
              onClick: () => { isDevMode.value = !isDevMode.value; persistSettings(); }
            }, 'Dev Settings')
          ]),

          // Only render Server Endpoint fields in Developer standalone mode!
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
              onClick: handleConnect
            }, isConnecting.value ? 'Authenticating...' : 'Sign In & Sync')
          ])
        ])
      ]) : null,

      // 3. Main Workspace Layout Split (If Authenticated)
      isAuthenticated.value ? h('div', { class: 'o_action_manager' }, [
        // Sidebar Left Menu
        activeMenu.value?.subsections ? h('aside', { class: 'o_sidebar' }, [
          activeMenu.value.subsections.map((section: any) => h('div', { class: 'o_sidebar_section' }, [
            h('div', { class: 'o_sidebar_section_title' }, section.title),
            section.items.map((item: any) => h('a', {
              class: ['o_sidebar_link', activeMenuName.value === item.name ? 'active' : ''],
              onClick: () => selectSubmenu(item)
            }, item.name))
          ]))
        ]) : null,

        // Right Workspace Window
        h('div', { style: 'flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;' }, [
          // Control Panel
          h('div', { class: 'o_control_panel' }, [
            h('div', { class: 'o_cp_left' }, [
              // Breadcrumbs
              h('div', { class: 'o_breadcrumb' }, [
                h('span', { class: 'o_breadcrumb_link', onClick: () => { activeViewType.value = 'list'; } }, activeMenu.value?.name),
                h('span', { class: 'o_breadcrumb_separator' }, '/'),
                h('span', null, activeViewType.value === 'form' && selectedRecord.value ? (selectedRecord.value.get('name') || selectedRecord.value.get('display_name')) : activeMenuName.value)
              ]),
              // Actions
              h('div', { class: 'o_cp_buttons' }, [
                activeViewType.value !== 'form'
                  ? h('button', { class: 'o_btn_primary', onClick: handleCreate }, 'New')
                  : h('div', { style: 'display: flex; gap: 8px;' }, [
                      readonlyMode.value
                        ? h('button', { class: 'o_btn_primary', onClick: toggleEdit }, 'Edit')
                        : h('button', { class: 'o_btn_primary', onClick: saveChanges }, 'Save'),
                      !readonlyMode.value
                        ? h('button', { class: 'o_btn_secondary', onClick: discardChanges }, 'Discard')
                        : h('button', { class: 'o_btn_secondary', onClick: () => { activeViewType.value = 'list'; } }, 'Back to List')
                    ])
              ])
            ]),

            h('div', { class: 'o_cp_right' }, [
              h('div', { style: 'display: flex; gap: 16px; align-items: center;' }, [
                // Pager
                activeViewType.value !== 'form' ? h('div', { class: 'o_pager' }, [
                  h('span', { class: 'o_pager_value' }, `${currentOffset.value + 1}-${Math.min(currentOffset.value + currentLimit.value, totalRecordsCount.value)}`),
                  h('span', null, '/'),
                  h('span', null, totalRecordsCount.value),
                  h('button', { class: 'o_pager_btn', disabled: currentOffset.value === 0, onClick: handlePagePrev }, '‹'),
                  h('button', { class: 'o_pager_btn', disabled: currentOffset.value + currentLimit.value >= totalRecordsCount.value, onClick: handlePageNext }, '›')
                ]) : null,

                // Search Bar
                activeViewType.value !== 'form' ? h('div', { class: 'o_cp_searchview' }, [
                  h('span', null, '🔍'),
                  h('input', {
                    class: 'o_cp_searchview_input',
                    placeholder: `Search ${activeMenu.value?.name}...`,
                    value: searchQuery.value,
                    onInput: (e: any) => { searchQuery.value = e.target.value; }
                  })
                ]) : null,

                // View Switcher
                h('div', { class: 'o_cp_switch_buttons' }, [
                  h('button', { class: ['o_switch_btn', activeViewType.value === 'list' ? 'active' : ''], onClick: () => setViewType('list') }, 'List ☰'),
                  h('button', { class: ['o_switch_btn', activeViewType.value === 'kanban' ? 'active' : ''], onClick: () => setViewType('kanban') }, 'Kanban ⚃'),
                  h('button', { class: ['o_switch_btn', activeViewType.value === 'form' ? 'active' : ''], disabled: !selectedRecord.value, onClick: () => setViewType('form') }, 'Form ▭')
                ])
              ])
            ])
          ]),

          // Main Render Area
          h('main', { class: 'o_content' }, [
            isConnecting.value ? h('div', { style: 'display: flex; justify-content: center; align-items: center; height: 100%; color: #666;' }, 'Synchronizing backend data...') : null,
            
            // List View Render
            !isConnecting.value && activeViewType.value === 'list' ? h('div', null, [
              h(ListRenderer, {
                arch: listArch.value,
                records: filteredRecords.value,
                onClick: (e: any) => {
                  const tr = e.target.closest('tr');
                  if (tr) {
                    const index = Array.from(tr.parentNode.children).indexOf(tr);
                    if (index >= 0) selectPartner(filteredRecords.value[index]);
                  }
                }
              })
            ]) : null,

            // Kanban View Render (CardRenderer)
            !isConnecting.value && activeViewType.value === 'kanban' ? h('div', { class: 'o_kanban_view' }, 
              filteredRecords.value.map(rec => h('div', {
                class: 'o_kanban_record',
                onClick: () => selectPartner(rec)
              }, [
                h('div', { class: 'o_kanban_title' }, rec.get('name') || rec.get('display_name')),
                h('div', { class: 'o_kanban_subtitle' }, rec.get('email') || rec.get('customer') || rec.get('product') || '')
              ]))
            ) : null,

            // Form View Render
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
      ]) : null
    ]);
  }
};

createApp(App).mount('#app');
