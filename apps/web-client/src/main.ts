import { createApp, h, reactive, ref, computed, onMounted } from 'vue';
import { RecordProxy, HashRouter, RPCClient, SessionManager } from '@odoo/sdk';
import { ListRenderer, FormRenderer } from '@odoo/vue-runtime';

// 1. Define Standalone Demo Mock Data (Local Fallback Mode)
const mockPartners = [
  new RecordProxy('res.partner', { id: 1, name: 'Mitchell Admin (Mock)', active: true, email: 'admin@yourcompany.example.com', website: 'https://yourcompany.com' }),
  new RecordProxy('res.partner', { id: 2, name: 'Marc Demo (Mock)', active: true, email: 'demo@yourcompany.example.com', website: 'https://demo.com' }),
  new RecordProxy('res.partner', { id: 3, name: 'Deco Addict (Mock)', active: false, email: 'deco@addict.example.com', website: 'https://deco-addict.com' })
];

// 2. Reactive Application State
const partnerRecords = reactive<RecordProxy[]>([...mockPartners]);
const currentApp = ref('Contacts');
const activeViewType = ref<'list' | 'form'>('list');
const selectedRecord = ref<RecordProxy>(partnerRecords[0]);
const readonlyMode = ref(true);
const searchQuery = ref('');
const activeFilter = ref<'all' | 'active'>('all');

// 3. Connect to Real Odoo Backend Modal State
const showModal = ref(false);
const hostUrl = ref('http://localhost:8069');
const dbName = ref('demo');
const username = ref('admin');
const password = ref('admin');
const isConnected = ref(false);
const isConnecting = ref(false);
const activeClient = ref<RPCClient | null>(null);

// 4. Instantiate the HashRouter to power our SPA routing
const router = new HashRouter(window.location);

// 5. Define UI View Compile Archs
const listArch = {
  type: 'list',
  children: [
    { tag: 'field', attrs: { name: 'name', string: 'Name' } },
    { tag: 'field', attrs: { name: 'email', string: 'Email', widget: 'email' } },
    { tag: 'field', attrs: { name: 'website', string: 'Website', widget: 'url' } },
    { tag: 'field', attrs: { name: 'active', string: 'Is Active?' } }
  ]
};

const formArch = {
  type: 'form',
  children: [
    {
      tag: 'sheet',
      children: [
        { tag: 'field', attrs: { name: 'name', string: 'Name' } },
        { tag: 'field', attrs: { name: 'email', string: 'Email', widget: 'email' } },
        { tag: 'field', attrs: { name: 'website', string: 'Website', widget: 'url' } },
        { tag: 'field', attrs: { name: 'active', string: 'Active' } }
      ]
    }
  ]
};

// 6. Create App Component
const App = {
  setup() {
    // Dynamic record filtering based on filters & search queries
    const filteredRecords = computed(() => {
      return partnerRecords.filter(rec => {
        const nameVal = rec.get('name') || '';
        const matchesSearch = String(nameVal).toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesFilter = activeFilter.value === 'all' || rec.get('active') === true;
        return matchesSearch && matchesFilter;
      });
    });

    // Sync active reactive states to the browser URL hash
    const syncStateToHash = () => {
      const params: Record<string, string | number> = {
        app: currentApp.value,
        view_type: activeViewType.value
      };
      if (activeViewType.value === 'form' && selectedRecord.value) {
        params.id = selectedRecord.value.id || '';
      }
      router.setParams(params);
    };

    // Triggered when clicking a row in List view
    const selectPartner = (rec: RecordProxy) => {
      selectedRecord.value = rec;
      activeViewType.value = 'form';
      readonlyMode.value = true;
      syncStateToHash();
    };

    // Triggered when clicking back-links, breadcrumbs or view switchers
    const setViewType = (view: 'list' | 'form') => {
      activeViewType.value = view;
      syncStateToHash();
    };

    // Sync records from a real live backend
    const syncFromBackend = async () => {
      if (!activeClient.value) return;
      try {
        const realData = await activeClient.value.search_read(
          'res.partner',
          [],
          ['name', 'email', 'website', 'active'],
          20
        );

        const proxies = realData.map((d: any) => new RecordProxy('res.partner', d, activeClient.value!));
        partnerRecords.splice(0, partnerRecords.length, ...proxies);
        selectedRecord.value = partnerRecords[0] || new RecordProxy('res.partner', { name: 'Empty' });
        activeViewType.value = 'list';
        syncStateToHash();
      } catch (err: any) {
        alert('Error fetching records from Odoo backend: ' + err.message);
      }
    };

    // Authenticate & Connect Odoo Session
    const handleConnect = async () => {
      isConnecting.value = true;
      try {
        const client = new RPCClient({ endpoint: hostUrl.value });
        const session = new SessionManager(client);
        await session.login(dbName.value, username.value, password.value);
        
        activeClient.value = client;
        isConnected.value = true;
        showModal.value = false;

        // Fetch real data on successful connection
        await syncFromBackend();
      } catch (err: any) {
        alert('Failed to connect to Odoo backend: ' + err.message);
      } finally {
        isConnecting.value = false;
      }
    };

    // Revert back to isolated mock mode
    const handleDisconnect = () => {
      isConnected.value = false;
      activeClient.value = null;
      partnerRecords.splice(0, partnerRecords.length, ...mockPartners);
      selectedRecord.value = partnerRecords[0];
      activeViewType.value = 'list';
      syncStateToHash();
    };

    const handleCreate = () => {
      if (isConnected.value && activeClient.value) {
        const newRec = new RecordProxy('res.partner', { id: null, name: 'New Contact', active: true }, activeClient.value);
        selectedRecord.value = newRec;
      } else {
        const newId = partnerRecords.length + 1;
        const newRec = new RecordProxy('res.partner', { id: newId, name: 'New Contact', active: true });
        partnerRecords.push(newRec);
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
        if (selectedRecord.value.client) {
          const isNew = selectedRecord.value.id === null;
          await selectedRecord.value.save();
          if (isNew) {
            partnerRecords.push(selectedRecord.value);
          }
        } else {
          Object.assign((selectedRecord.value as any)._data, (selectedRecord.value as any)._changes);
          (selectedRecord.value as any)._changes = {};
        }
        readonlyMode.value = true;
      } catch (err: any) {
        alert('Odoo Backend Save Error: ' + err.message);
      }
    };

    const discardChanges = () => {
      selectedRecord.value.discard();
      readonlyMode.value = true;
    };

    const navigateToApp = (appName: string) => {
      currentApp.value = appName;
      activeViewType.value = 'list';
      syncStateToHash();
    };

    // Listen to incoming hash/route updates and synchronize our reactive state (SPA PopState)
    const handleHashNavigation = (params: Record<string, string>) => {
      if (params.app) {
        currentApp.value = params.app;
      }
      if (params.view_type) {
        activeViewType.value = params.view_type as any;
      }
      if (params.id) {
        const recordId = Number(params.id);
        const found = partnerRecords.find(r => r.id === recordId);
        if (found) {
          selectedRecord.value = found;
        }
      }
    };

    onMounted(() => {
      // 1. Process initial route from incoming address bar (Deep Linking)
      const initialParams = router.getParams();
      if (Object.keys(initialParams).length > 0) {
        handleHashNavigation(initialParams);
      } else {
        // Populate default values in URL bar on clean boot
        syncStateToHash();
      }

      // 2. Bind PopState navigation callback
      router.onNavigate(handleHashNavigation);
    });

    return () => h('div', { style: 'height: 100%; display: flex; flex-direction: column;' }, [
      // 1. Top Navbar
      h('header', { class: 'o_main_navbar' }, [
        h('div', { class: 'o_navbar_left' }, [
          h('div', { class: 'o_menu_brand', onClick: () => navigateToApp('Contacts') }, '☰ Odoo'),
          h('nav', { class: 'o_navbar_apps' }, [
            h('a', {
              class: ['o_nav_link', currentApp.value === 'Contacts' ? 'active' : ''],
              onClick: () => navigateToApp('Contacts')
            }, 'Contacts'),
            h('a', {
              class: ['o_nav_link', currentApp.value === 'Sales' ? 'active' : ''],
              onClick: () => navigateToApp('Sales')
            }, 'Sales'),
            h('a', {
              class: ['o_nav_link', currentApp.value === 'MRP' ? 'active' : ''],
              onClick: () => navigateToApp('MRP')
            }, 'Manufacturing')
          ])
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
            }, currentApp.value),
            activeViewType.value === 'form' ? h('span', { class: 'o_breadcrumb_separator' }, '/') : null,
            activeViewType.value === 'form' ? h('span', null, selectedRecord.value.get('name')) : null
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
                placeholder: 'Search partners...',
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
              onClick: () => setViewType('form')
            }, 'Form ▭')
          ])
        ])
      ]),

      // 3. Main Content Viewport
      h('main', { class: 'o_content' }, [
        activeViewType.value === 'list'
          ? h('div', null, [
              h('h4', { style: 'margin-top: 0; color: #495057;' }, `${currentApp.value} Directory`),
              h(ListRenderer, {
                arch: listArch,
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
          : h('div', { class: 'o_form_sheet_bg' }, [
              h('div', { class: 'o_form_sheet' }, [
                h(FormRenderer, {
                  arch: formArch,
                  record: selectedRecord.value,
                  readonly: readonlyMode.value
                })
              ])
            ])
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
