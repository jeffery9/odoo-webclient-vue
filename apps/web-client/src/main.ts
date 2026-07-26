import { createApp, h, reactive, ref } from 'vue';
import { RecordProxy, ActionManager } from '@odoo/sdk';
import { ListRenderer, FormRenderer } from '@odoo/vue-runtime';

// 1. Setup Mock Odoo Data
const partnerRecords = reactive([
  new RecordProxy('res.partner', { id: 1, name: 'Mitchell Admin', active: true }),
  new RecordProxy('res.partner', { id: 2, name: 'Marc Demo', active: false })
]);

const selectedRecord = ref<RecordProxy>(partnerRecords[0]);
const readonlyMode = ref(false);

// 2. Setup Action Manager
const actionManager = reactive(new ActionManager());
actionManager.doAction({
  name: 'Contacts',
  res_model: 'res.partner',
  type: 'ir.actions.act_window',
  views: [[false, 'list']],
  target: 'current'
});

// 3. Define UI View Compile Archs
const listArch = {
  type: 'list',
  children: [
    { tag: 'field', attrs: { name: 'name', string: 'Name' } },
    { tag: 'field', attrs: { name: 'active', string: 'Is Active?' } }
  ]
};

const formArch = {
  type: 'form',
  children: [
    {
      tag: 'sheet',
      children: [
        { tag: 'field', attrs: { name: 'name' } }
      ]
    }
  ]
};

// 4. Create App Component
const App = {
  setup() {
    const selectPartner = (rec: RecordProxy) => {
      selectedRecord.value = rec;
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

    return () => h('div', null, [
      // Control Panel
      h('div', { class: 'o_control_panel' }, [
        h('div', { class: 'o_breadcrumbs' }, actionManager.breadcrumbs.join(' / ')),
        h('div', null, [
          h('button', { class: 'o_btn', onClick: toggleEdit }, readonlyMode.value ? 'Edit' : 'Readonly Mode'),
          h('button', { class: 'o_btn o_btn_secondary', style: 'margin-left: 10px', onClick: saveChanges, disabled: readonlyMode.value }, 'Save'),
          h('button', { class: 'o_btn o_btn_secondary', style: 'margin-left: 10px', onClick: discardChanges, disabled: readonlyMode.value }, 'Discard')
        ])
      ]),

      // StatusBar
      h('div', { class: 'o_statusbar' }, [
        h('span', { class: 'o_statusbar_status' }, 'Active State: Open')
      ]),

      h('h3', null, 'Contacts List (Click to select)'),
      // Mount ListRenderer
      h(ListRenderer, {
        arch: listArch,
        records: partnerRecords,
        onClick: (e: any) => {
          const tr = e.target.closest('tr');
          if (tr) {
            const index = Array.from(tr.parentNode.children).indexOf(tr);
            if (index >= 0) selectPartner(partnerRecords[index]);
          }
        }
      }),

      h('h3', { style: 'margin-top: 30px' }, 'Contact Form Details'),
      // Mount FormRenderer
      h(FormRenderer, {
        arch: formArch,
        record: selectedRecord.value
      })
    ]);
  }
};

createApp(App).mount('#app');
