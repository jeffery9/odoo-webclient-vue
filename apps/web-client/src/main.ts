import { createApp, h, reactive, ref, computed, onMounted } from 'vue';
import { RecordProxy, HashRouter, RPCClient, SessionManager, ArchCompiler } from '@odoo/sdk';
import { ListRenderer, FormRenderer } from '@odoo/vue-runtime';

// ==========================================
// 1. Simulated Offline Mock Metadata Database
// ==========================================
const mockMenus = [
  { id: 1, name: 'Contacts', actionID: 101 },
  { id: 2, name: 'Sales', actionID: 102 },
  { id: 3, name: 'Manufacturing', actionID: 103 }
];

const mockActions: Record<number, any> = {
  101: {
    name: 'Contacts',
    res_model: 'res.partner',
    views: [[false, 'list'], [false, 'form']]
  },
  102: {
    name: 'Sales Quotations',
    res_model: 'sale.order',
    views: [[false, 'list'], [false, 'form']]
  },
  103: {
    name: 'Manufacturing Orders',
    res_model: 'mrp.production',
    views: [[false, 'list'], [false, 'form']]
  }
};

const mockViews: Record<string, { list: string; form: string }> = {
  'res.partner': {
    list: `<tree><field name="name" string="Name"/><field name="email" string="Email"/><field name="website" string="Website"/><field name="active" string="Is Active?"/></tree>`,
    form: `<form><sheet><field name="name"/><field name="email"/><field name="website"/><field name="active"/></sheet></form>`
  },
  'sale.order': {
    list: `<tree><field name="name" string="Order ID"/><field name="customer" string="Customer"/><field name="amount_total" string="Amount Total"/><field name="state" string="Status"/></tree>`,
    form: `<form><sheet><field name="name"/><field name="customer"/><field name="amount_total"/><field name="state"/></sheet></form>`
  },
  'mrp.production': {
    list: `<tree><field name="name" string="Manufacturing Reference"/><field name="product" string="Product"/><field name="qty_producing" string="Quantity"/><field name="state" string="State"/></tree>`,
    form: `<form><sheet><field name="name"/><field name="product"/><field name="qty_producing"/><field name="state"/></sheet></form>`
  }
};

const mockRecords: Record<string, any[]> = {
  'res.partner': [
    { id: 1, name: 'Mitchell Admin (Mock)', email: 'admin@yourcompany.com', website: 'https://yourcompany.com', active: true },
    { id: 2, name: 'Marc Demo (Mock)', email: 'demo@yourcompany.com', website: 'https://demo.com', active: true },
    { id: 3, name: 'Deco Addict (Mock)', email: 'deco@addict.com', website: 'https://deco.com', active: false }
  ],
  'sale.order': [
    { id: 1, name: 'S0001 (Mock)', customer: 'Mitchell Admin', amount_total: 1250.00, state: 'draft' },
    { id: 2, name: 'S0002 (Mock)', customer: 'Marc Demo', amount_total: 4500.00, state: 'sale' }
  ],
  'mrp.production': [
    { id: 1, name: 'WH/MO/0001 (Mock)', product: 'Odoo Desk Cabinet', qty_producing: 10, state: 'draft' },
    { id: 2, name: 'WH/MO/0002 (Mock)', product: 'Executive Ergonomic Chair', qty_producing: 50, state: 'done' }
  ]
};

// ==========================================
// 2. Reactive Application State
// ==========================================
const menus = ref<any[]>(mockMenus);
const activeMenu = ref<any>(mockMenus[0]);
const activeAction = ref<any>(mockActions[101]);

const partnerRecords = reactive<RecordProxy[]>([]);
const activeViewType = ref<'list' | 'form'>('list');
const selectedRecord = ref<RecordProxy | null>(null);
const readonlyMode = ref(true);
const searchQuery = ref('');
const activeFilter = ref<'all' | 'active'>('all');

const listArch = ref<any>({ type: 'list', children: [] });
const formArch = ref<any>({ type: 'form', children: [] });

// Connect Backend State
const showModal = ref(false);
const hostUrl = ref('http://localhost:8069');
const dbName = ref('demo');
const username = ref('admin');
const password = ref('admin');
const isConnected = ref(false);
const isConnecting = ref(false);
const activeClient = ref<RPCClient | null>(null);

// 3. Instantiate HashRouter
const router = new HashRouter(window.location);

// ==========================================
// 4. Create App Component
// ==========================================
const App = {
  setup() {
    // Filter records dynamically based on active filter and search text
    const filteredRecords = computed(() => {
      return partnerRecords.filter(rec => {
        const nameVal = rec.get('name') || rec.get('display_name') || '';
        const matchesSearch = String(nameVal).toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesFilter = activeFilter.value === 'all' || rec.get('active') !== false;
        return matchesSearch && matchesFilter;
      });
    });

    const syncStateToHash = () => {
      const params: Record<string, string | number> = {
        menu_id: activeMenu.value ? activeMenu.value.id : '',
        view_type: activeViewType.value
      };
      if (activeViewType.value === 'form' && selectedRecord.value) {
        params.id = selectedRecord.value.id || '';
      }
      router.setParams(params);
    };

    // Main Execution Pipeline (Odoo Dynamic Loader)
    const executeAction = async (actionId: number) => {
      isConnecting.value = true;
      try {
        let action: any = null;
        let model = 'res.partner';
        let rawListXml = '';
        let rawFormXml = '';
        let recordsData: any[] = [];

        if (isConnected.value && activeClient.value) {
          // --- ODOO LIVE MODE ---
          // 1. Load action definition from Odoo server
          action = await activeClient.value.loadAction(actionId);
          if (!action || !action.res_model) {
            throw new Error(`Loaded Odoo action ${actionId} does not specify a valid res_model`);
          }
          model = action.res_model;

          // 2. Fetch layout XML view architectures from Odoo via load_views
          const viewsToLoad: [number | boolean, string][] = action.views || [[false, 'list'], [false, 'form']];
          const viewsResponse = await activeClient.value.loadViews(model, viewsToLoad);
          const viewsMap = viewsResponse?.fields_views || {};

          rawListXml = viewsMap.list?.arch || viewsMap.tree?.arch || '';
          rawFormXml = viewsMap.form?.arch || '';

          // 3. Fetch real records dynamically based on Action specs
          const domain = action.domain || [];
          const limit = action.limit || 80;
          
          // Determine search_read fields from the XML compiled nodes to save bandwidth
          const fieldsToSelect: string[] = ['name', 'active'];
          recordsData = await activeClient.value.search_read(model, domain, fieldsToSelect, limit);
        } else {
          // --- OFFLINE SIMULATED MODE ---
          action = mockActions[actionId];
          if (!action) return;
          model = action.res_model;
          
          rawListXml = mockViews[model]?.list || '';
          rawFormXml = mockViews[model]?.form || '';
          recordsData = mockRecords[model] || [];
        }

        activeAction.value = action;

        // 4. Compile Raw XML templates dynamically into Semantic JSON IR on the fly!
        if (rawListXml) {
          listArch.value = ArchCompiler.compile(rawListXml);
        } else {
          listArch.value = {
            type: 'list',
            children: [{ tag: 'field', attrs: { name: 'name', string: 'Name' } }]
          };
        }

        if (rawFormXml) {
          formArch.value = ArchCompiler.compile(rawFormXml);
        } else {
          formArch.value = {
            type: 'form',
            children: [{ tag: 'sheet', children: [{ tag: 'field', attrs: { name: 'name' } }] }]
          };
        }

        // 5. Wrap raw datasets in reactive RecordProxies
        const clientRef = isConnected.value ? activeClient.value! : undefined;
        const proxies = recordsData.map((d: any) => new RecordProxy(model, d, clientRef));
        partnerRecords.splice(0, partnerRecords.length, ...proxies);
        selectedRecord.value = partnerRecords[0] || null;
        activeViewType.value = 'list';
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

    const setViewType = (view: 'list' | 'form') => {
      activeViewType.value = view;
      syncStateToHash();
    };

    // Authenticate, pull Menus, and execute starting Action
    const handleConnect = async () => {
      isConnecting.value = true;
      try {
        const client = new RPCClient({ endpoint: hostUrl.value });
        const session = new SessionManager(client);
        await session.login(dbName.value, username.value, password.value);
        
        activeClient.value = client;
        isConnected.value = true;
        showModal.value = false;

        // 1. Fetch real Odoo Menu items dynamically!
        const odooMenus = await client.loadMenus();
        const rootMenu = odooMenus?.root || {};
        const parsedMenus: any[] = [];

        // Traverse first level of menu tree to draw top Navbar apps
        if (rootMenu.children) {
          for (const mid of rootMenu.children) {
            const m = odooMenus[mid];
            if (m) {
              let actId = m.actionID || m.action_id || m.action;
              if (typeof actId === 'string') {
                const parts = actId.split(',');
                actId = Number(parts[parts.length - 1]);
              }
              parsedMenus.push({
                id: m.id,
                name: m.name,
                actionID: actId || null
              });
            }
          }
        }

        if (parsedMenus.length > 0) {
          menus.value = parsedMenus;
          activeMenu.value = parsedMenus[0];
          if (parsedMenus[0].actionID) {
            await executeAction(parsedMenus[0].actionID);
          }
        } else {
          // Fallback to offline menus if no server menus present
          menus.value = mockMenus;
          activeMenu.value = mockMenus[0];
          await executeAction(mockMenus[0].actionID);
        }
      } catch (err: any) {
        alert('Failed to connect to Odoo backend: ' + err.message);
      } finally {
        isConnecting.value = false;
      }
    };

    // Disconnect and fall back to local mock environment
    const handleDisconnect = () => {
      isConnected.value = false;
      activeClient.value = null;
      menus.value = mockMenus;
      activeMenu.value = mockMenus[0];
      executeAction(mockMenus[0].actionID);
    };

    const navigateToMenu = async (menu: any) => {
      activeMenu.value = menu;
      activeViewType.value = 'list';
      if (menu.actionID) {
        await executeAction(menu.actionID);
      }
    };

    const handleCreate = () => {
      const model = activeAction.value?.res_model || 'res.partner';
      if (isConnected.value && activeClient.value) {
        const newRec = new RecordProxy(model, { id: null, name: 'New Record' }, activeClient.value);
        selectedRecord.value = newRec;
      } else {
        const newRec = new RecordProxy(model, { id: null, name: 'New Record (Mock)' });
        selectedRecord.value = newRec;
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
        } else if (selectedRecord.value) {
          const model = activeAction.value?.res_model || 'res.partner';
          const isNew = selectedRecord.value.id === null;
          
          Object.assign((selectedRecord.value as any)._data, (selectedRecord.value as any)._changes);
          (selectedRecord.value as any)._changes = {};

          if (isNew) {
            selectedRecord.value._data.id = partnerRecords.length + 1;
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

    // SPA Route PopState handler
    const handleHashNavigation = async (params: Record<string, string>) => {
      if (params.menu_id) {
        const menuId = Number(params.menu_id);
        const foundMenu = menus.value.find(m => m.id === menuId);
        if (foundMenu && foundMenu !== activeMenu.value) {
          activeMenu.value = foundMenu;
          if (foundMenu.actionID) {
            await executeAction(foundMenu.actionID);
          }
        }
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
      // Clean boot pipeline
      const initialParams = router.getParams();
      if (Object.keys(initialParams).length > 0) {
        await handleHashNavigation(initialParams);
      } else {
        // Run first mock app on boot
        await executeAction(mockMenus[0].actionID);
      }
      router.onNavigate(handleHashNavigation);
    });

    return () => h('div', { style: 'height: 100%; display: flex; flex-direction: column;' }, [
      // 1. Top Navbar
      h('header', { class: 'o_main_navbar' }, [
        h('div', { class: 'o_navbar_left' }, [
          h('div', { class: 'o_menu_brand', onClick: () => navigateToMenu(menus.value[0]) }, '☰ Odoo'),
          h('nav', { class: 'o_navbar_apps' }, 
            menus.value.map(m => h('a', {
              class: ['o_nav_link', activeMenu.value?.id === m.id ? 'active' : ''],
              onClick: () => navigateToMenu(m)
            }, m.name))
          )
        ]),
        h('div', { class: 'o_navbar_right' }, [
          // Connection Toggle Button
          isConnected.value
            ? h('button', { class: 'o_connect_btn connected', onClick: handleDisconnect }, '🟢 Connected')
            : h('button', { class: 'o_connect_btn', onClick: () => { showModal.value = true; } }, '🔌 Connect Backend'),
          h('span', { style: 'font-weight: 500; margin-left: 10px;' }, 'Mitchell Admin'),
          h('div', { class: 'o_user_avatar' }, 'M')
        ])
      ]),

      // 2. Control Panel
      h('div', { class: 'o_control_panel' }, [
        h('div', { class: 'o_cp_left' }, [
          // Breadcrumbs (fully clickable back links)
          h('div', { class: 'o_breadcrumb' }, [
            h('span', {
              class: 'o_breadcrumb_link',
              onClick: () => setViewType('list')
            }, activeMenu.value?.name || 'Home'),
            activeViewType.value === 'form' && selectedRecord.value ? h('span', { class: 'o_breadcrumb_separator' }, '/') : null,
            activeViewType.value === 'form' && selectedRecord.value ? h('span', null, selectedRecord.value.get('name') || selectedRecord.value.get('display_name')) : null
          ]),
          // Action Buttons
          h('div', { class: 'o_cp_buttons' }, [
            activeViewType.value === 'list'
              ? h('button', { class: 'o_btn_primary', onClick: handleCreate }, 'New')
              : h('div', { style: 'display: flex; gap: 8px;' }, [
                  readonlyMode.value
                    ? h('button', { class: 'o_btn_primary', onClick: toggleEdit }, 'Edit')
                    : h('button', { class: 'o_btn_primary', onClick: saveChanges }, 'Save'),
                  !readonlyMode.value
                    ? h('button', { class: 'o_btn_secondary', onClick: discardChanges }, 'Discard')
                    : h('button', { class: 'o_btn_secondary', onClick: () => setViewType('list') }, 'Back to List')
                ])
          ])
        ]),

        h('div', { class: 'o_cp_right' }, [
          // Dynamic Search bar with inputs and filters
          activeViewType.value === 'list' ? h('div', { style: 'display: flex; gap: 12px; align-items: center;' }, [
            h('div', { class: 'o_cp_searchview' }, [
              h('span', null, '🔍'),
              h('input', {
                class: 'o_cp_searchview_input',
                placeholder: 'Search...',
                value: searchQuery.value,
                onInput: (e: any) => { searchQuery.value = e.target.value; }
              })
            ]),
            h('div', { class: 'o_cp_filters' }, [
              h('button', {
                class: ['o_filter_btn', activeFilter.value === 'all' ? 'active' : ''],
                onClick: () => { activeFilter.value = 'all'; }
              }, 'All'),
              h('button', {
                class: ['o_filter_btn', activeFilter.value === 'active' ? 'active' : ''],
                onClick: () => { activeFilter.value = 'active'; }
              }, 'Active Only')
            ])
          ]) : null,
          // View Switcher (fully synchronized SPA routing)
          h('div', { class: 'o_cp_switch_buttons' }, [
            h('button', {
              class: ['o_switch_btn', activeViewType.value === 'list' ? 'active' : ''],
              onClick: () => setViewType('list')
            }, 'List ☰'),
            h('button', {
              class: ['o_switch_btn', activeViewType.value === 'form' ? 'active' : ''],
              disabled: !selectedRecord.value,
              onClick: () => setViewType('form')
            }, 'Form ▭')
          ])
        ])
      ]),

      // 3. Main Content Viewport
      h('main', { class: 'o_content' }, [
        isConnecting.value ? h('div', { style: 'display: flex; justify-content: center; align-items: center; height: 100%; color: #666; font-size: 16px;' }, 'Loading metadata & compiling views...') : null,
        !isConnecting.value && activeViewType.value === 'list'
          ? h('div', null, [
              h('h4', { style: 'margin-top: 0; color: #495057;' }, `${activeMenu.value?.name} Directory`),
              h(ListRenderer, {
                arch: listArch.value,
                records: filteredRecords.value,
                onClick: (e: any) => {
                  const tr = e.target.closest('tr');
                  if (tr) {
                    const index = Array.from(tr.parentNode.children).indexOf(tr);
                    if (index >= 0) {
                      selectPartner(filteredRecords.value[index]);
                    }
                  }
                }
              })
            ])
          : null,
        !isConnecting.value && activeViewType.value === 'form' && selectedRecord.value
          ? h('div', { class: 'o_form_sheet_bg' }, [
              h('div', { class: 'o_form_sheet' }, [
                h(FormRenderer, {
                  arch: formArch.value,
                  record: selectedRecord.value,
                  readonly: readonlyMode.value
                })
              ])
            ])
          : null
      ]),

      // 4. Interactive Connect Modal Overlay
      showModal.value ? h('div', { class: 'o_modal_overlay' }, [
        h('div', { class: 'o_modal_box' }, [
          h('h3', { class: 'o_modal_title' }, 'Connect Odoo Backend'),
          h('div', { class: 'o_modal_field' }, [
            h('label', { class: 'o_modal_label' }, 'Server Endpoint'),
            h('input', { class: 'o_modal_input', value: hostUrl.value, onInput: (e: any) => { hostUrl.value = e.target.value; } })
          ]),
          h('div', { class: 'o_modal_field' }, [
            h('label', { class: 'o_modal_label' }, 'Database'),
            h('input', { class: 'o_modal_input', value: dbName.value, onInput: (e: any) => { dbName.value = e.target.value; } })
          ]),
          h('div', { class: 'o_modal_field' }, [
            h('label', { class: 'o_modal_label' }, 'Username / Email'),
            h('input', { class: 'o_modal_input', value: username.value, onInput: (e: any) => { username.value = e.target.value; } })
          ]),
          h('div', { class: 'o_modal_field' }, [
            h('label', { class: 'o_modal_label' }, 'Password'),
            h('input', { type: 'password', class: 'o_modal_input', value: password.value, onInput: (e: any) => { password.value = e.target.value; } })
          ]),
          h('div', { style: 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 10px;' }, [
            h('button', { class: 'o_btn_secondary', onClick: () => { showModal.value = false; } }, 'Cancel'),
            h('button', {
              class: 'o_btn_primary',
              disabled: isConnecting.value,
              onClick: handleConnect
            }, isConnecting.value ? 'Connecting...' : 'Connect & Sync')
          ])
        ])
      ]) : null
    ]);
  }
};

createApp(App).mount('#app');
