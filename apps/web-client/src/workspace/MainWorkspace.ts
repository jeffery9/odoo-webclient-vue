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
