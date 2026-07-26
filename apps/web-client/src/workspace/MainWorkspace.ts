import { h, ref } from 'vue';
import { ListRenderer, FormRenderer } from '@odoo/vue-runtime';
import { RecordProxy } from '@odoo/sdk';
import { activeMenu } from '../layout/state.js';
import { isConnecting } from '../auth/state.js';
import { SearchPanel } from './SearchPanel.js';
import { addNotification } from '../layout/notification.js';
import {
  activeViewType,
  selectedRecord,
  readonlyMode,
  filteredRecords,
  listArch,
  formArch,
  searchArch,
  searchPanelDomain,
  activeAction
} from './state.js';
import { executeAction } from './actions.js';

export const MainWorkspace = {
  name: 'MainWorkspace',
  props: {
    onSelectRecord: { type: Function, required: true }
  },
  setup(props: { onSelectRecord: (rec: RecordProxy) => void }) {
    const isPrinting = ref(false);

    const handleFilterChange = async (domains: any[]) => {
      searchPanelDomain.value = domains;
      if (activeAction.value) {
        await executeAction(activeAction.value.id, { resetOffset: true });
      }
    };

    const hasSearchPanel = () => {
      if (!searchArch.value || searchArch.value.tag !== 'search') return false;
      return searchArch.value.children?.some((c: any) => c.tag === 'searchpanel');
    };

    return () => h('div', { class: 'o_action_manager' }, [
      // Left Navigation Subsection Sidebar (only visible for act_window actions)
      (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeMenu.value?.subsections ? h('aside', { class: 'o_sidebar' }, [
        activeMenu.value.subsections.map((section: any) => h('div', { class: 'o_sidebar_section' }, [
          h('div', { class: 'o_sidebar_section_title' }, section.title),
          section.items.map((item: any) => h('a', {
            class: ['o_sidebar_link', activeViewType.value === 'list' ? 'active' : ''],
            onClick: () => props.onSelectRecord(item)
          }, item.name))
        ]))
      ]) : null,

      // Left Search Panel (only visible for act_window actions)
      (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeViewType.value !== 'form' && hasSearchPanel() ? h(SearchPanel, {
        arch: searchArch.value,
        onFilterChange: handleFilterChange
      }) : null,

      // Right Main View Container
      h('div', { style: 'flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;' }, [
        h('main', { class: 'o_content' }, [
          isConnecting.value ? h('div', { style: 'display: flex; justify-content: center; align-items: center; height: 100%; color: #666;' }, 'Synchronizing backend data...') : null,

          // 1. Client Action Rendering
          !isConnecting.value && activeAction.value?.type === 'ir.actions.client' ? h('div', {
            class: 'o_client_action_container',
            style: 'padding: 24px; background: #f8fafc; height: 100%; display: flex; flex-direction: column; gap: 16px; width: 100%; box-sizing: border-box;'
          }, [
            h('div', {
              style: 'background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'
            }, [
              h('h2', { style: 'margin: 0 0 8px 0; color: #1e293b; font-size: 20px; font-weight: 600;' }, activeAction.value.name || 'Client Action'),
              h('div', { style: 'font-size: 13px; color: #64748b; margin-bottom: 16px;' }, `Action Type: ir.actions.client | Target Tag: "${activeAction.value.tag}"`),
              h('button', {
                class: 'btn btn-primary',
                style: 'background: #714B67; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 500; cursor: pointer;',
                onClick: () => {
                  addNotification(`Client Action "${activeAction.value.tag}" executed successfully with context.`, 'success');
                }
              }, 'Trigger Client Action Hook')
            ]),
            h('div', {
              style: 'background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'
            }, [
              h('h3', { style: 'margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #475569;' }, 'Action Parameters (Metadata)'),
              h('pre', {
                style: 'background: #f1f5f9; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 0; overflow-x: auto; color: #334155;'
              }, JSON.stringify(activeAction.value.params || {}, null, 2))
            ])
          ]) : null,

          // 2. Report Action Rendering
          !isConnecting.value && activeAction.value?.type === 'ir.actions.report' ? h('div', {
            class: 'o_report_action_container',
            style: 'padding: 24px; background: #f8fafc; height: 100%; display: flex; flex-direction: column; gap: 16px; width: 100%; box-sizing: border-box;'
          }, [
            h('div', {
              style: 'background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; max-width: 480px; margin: 40px auto; width: 100%;'
            }, [
              h('div', { style: 'font-size: 40px; margin-bottom: 12px;' }, '📄'),
              h('h2', { style: 'margin: 0 0 8px 0; color: #1e293b; font-size: 18px; font-weight: 600;' }, activeAction.value.name || 'Report Action'),
              h('div', { style: 'font-size: 13px; color: #64748b; margin-bottom: 20px;' }, `Report Name: ${activeAction.value.report_name} | Type: ${activeAction.value.report_type || 'PDF'}`),
              
              isPrinting.value ? h('div', { style: 'width: 100%; background: #e2e8f0; height: 6px; border-radius: 9999px; margin-bottom: 20px; overflow: hidden;' }, [
                h('div', {
                  style: 'background: #714B67; height: 100%; width: 60%;'
                })
              ]) : null,

              h('button', {
                class: 'btn btn-primary',
                disabled: isPrinting.value,
                style: `background: #714B67; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: ${isPrinting.value ? 'not-allowed' : 'pointer'}; opacity: ${isPrinting.value ? 0.7 : 1};`,
                onClick: async () => {
                  isPrinting.value = true;
                  addNotification(`Generating report "${activeAction.value.report_name}"...`, 'info');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  isPrinting.value = false;
                  addNotification(`Report "${activeAction.value.report_name}" compiled and downloaded successfully.`, 'success');
                }
              }, isPrinting.value ? 'Compiling PDF...' : 'Print Report (PDF)')
            ])
          ]) : null,

          // 3. Act Window - List Rendering
          !isConnecting.value && (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeViewType.value === 'list' ? h('div', null, [
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

          // 4. Act Window - Kanban (Card) Rendering
          !isConnecting.value && (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeViewType.value === 'kanban' ? h('div', { class: 'o_kanban_view' }, 
            filteredRecords.value.map(rec => h('div', {
              class: 'o_kanban_record',
              onClick: () => props.onSelectRecord(rec)
            }, [
              h('div', { class: 'o_kanban_title' }, rec.get('name') || rec.get('display_name')),
              h('div', { class: 'o_kanban_subtitle' }, rec.get('email') || rec.get('customer') || rec.get('product') || '')
            ]))
          ) : null,

          // 5. Act Window - Form Rendering
          !isConnecting.value && (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeViewType.value === 'form' && selectedRecord.value ? h('div', { class: 'o_form_sheet_bg' }, [
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
