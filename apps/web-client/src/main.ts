import { createApp, h, reactive, ref, computed } from 'vue';
import { RecordProxy } from '@odoo/sdk';
import { ListRenderer, FormRenderer, componentRegistry } from '@odoo/vue-runtime';

// 1. Setup Mock Odoo Data with standard fields and initial values
const partnerRecords = reactive([
  new RecordProxy('res.partner', { id: 1, name: 'Mitchell Admin', active: true, email: 'admin@yourcompany.example.com', website: 'https://yourcompany.com' }),
  new RecordProxy('res.partner', { id: 2, name: 'Marc Demo', active: true, email: 'demo@yourcompany.example.com', website: 'https://demo.com' }),
  new RecordProxy('res.partner', { id: 3, name: 'Deco Addict', active: false, email: 'deco@addict.example.com', website: 'https://deco-addict.com' })
]);

// 2. Active Application State
const currentApp = ref('Contacts');
const activeViewType = ref<'list' | 'form'>('list');
const selectedRecord = ref<RecordProxy>(partnerRecords[0]);
const readonlyMode = ref(true);
const searchQuery = ref('');
const activeFilter = ref<'all' | 'active'>('all');

// 3. Define UI View Compile Archs
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

// 4. Create App Component
const App = {
  setup() {
    // Filter records dynamically based on active filter and search text
    const filteredRecords = computed(() => {
      return partnerRecords.filter(rec => {
        const nameVal = rec.get('name') || '';
        const matchesSearch = String(nameVal).toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesFilter = activeFilter.value === 'all' || rec.get('active') === true;
        return matchesSearch && matchesFilter;
      });
    });

    const selectPartner = (rec: RecordProxy) => {
      selectedRecord.value = rec;
      activeViewType.value = 'form';
      readonlyMode.value = true;
    };

    const handleCreate = () => {
      const newId = partnerRecords.length + 1;
      const newRec = new RecordProxy('res.partner', { id: newId, name: 'New Contact', active: true });
      partnerRecords.push(newRec);
      selectedRecord.value = newRec;
      activeViewType.value = 'form';
      readonlyMode.value = false;
    };

    const toggleEdit = () => {
      readonlyMode.value = !readonlyMode.value;
    };

    const saveChanges = async () => {
      Object.assign((selectedRecord.value as any)._data, (selectedRecord.value as any)._changes);
      (selectedRecord.value as any)._changes = {};
      readonlyMode.value = true;
    };

    const discardChanges = () => {
      selectedRecord.value.discard();
      readonlyMode.value = true;
    };

    const navigateToApp = (appName: string) => {
      currentApp.value = appName;
      activeViewType.value = 'list';
    };

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
          h('span', { style: 'font-weight: 500' }, 'Mitchell Admin'),
          h('div', { class: 'o_user_avatar' }, 'M')
        ])
      ]),

      // 2. Control Panel
      h('div', { class: 'o_control_panel' }, [
        h('div', { class: 'o_cp_left' }, [
          // Breadcrumbs
          h('div', { class: 'o_breadcrumb' }, [
            h('span', {
              class: 'o_breadcrumb_link',
              onClick: () => { activeViewType.value = 'list'; }
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
                    : h('button', { class: 'o_btn_secondary', onClick: () => { activeViewType.value = 'list'; } }, 'Back to List')
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
          // View Switcher
          h('div', { class: 'o_cp_switch_buttons' }, [
            h('button', {
              class: ['o_switch_btn', activeViewType.value === 'list' ? 'active' : ''],
              onClick: () => { activeViewType.value = 'list'; }
            }, 'List ☰'),
            h('button', {
              class: ['o_switch_btn', activeViewType.value === 'form' ? 'active' : ''],
              onClick: () => { activeViewType.value = 'form'; }
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
      ])
    ]);
  }
};

createApp(App).mount('#app');
