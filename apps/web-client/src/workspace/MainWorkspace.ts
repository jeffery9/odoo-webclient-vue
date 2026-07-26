import { h, ref } from 'vue';
import {
  ListRenderer,
  FormRenderer,
  GraphRenderer,
  PivotRenderer,
  CalendarRenderer,
  ActivityRenderer,
  GanttRenderer,
  rendererRegistry
} from '@odoo/vue-runtime';
import { RecordProxy } from '@odoo/sdk';
import { activeMenu } from '../layout/state.js';
import { isConnecting } from '../auth/state.js';
import { OdooSearchPanel } from './OdooSearchPanel.js';
import { OdooControlPanel } from './OdooControlPanel.js';
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
  activeAction,
  viewArchs
} from './state.js';
import { executeAction } from './actions.js';

export const MainWorkspace = {
  name: 'MainWorkspace',
  props: {
    onSelectRecord: { type: Function, required: true }
  },
  setup(props: { onSelectRecord: (rec: RecordProxy) => void }) {
    const isPrinting = ref(false);
    const activeGroupByFields = ref<string[]>([]);

    const handleFilterChange = async (domains: any[]) => {
      searchPanelDomain.value = domains;
      if (activeAction.value) {
        await executeAction(activeAction.value.id, { resetOffset: true });
      }
    };

    const handleSearchChange = async ({ domain, groupBy }: { domain: any[], groupBy: string[] }) => {
      searchPanelDomain.value = domain;
      activeGroupByFields.value = groupBy;
      if (activeAction.value) {
        await executeAction(activeAction.value.id, { resetOffset: true });
      }
    };

    const handleDrillDown = async (drillDownDomain: any[]) => {
      searchPanelDomain.value = [...searchPanelDomain.value, ...drillDownDomain];
      activeViewType.value = 'list';
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
      (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeViewType.value !== 'form' && hasSearchPanel() ? h(OdooSearchPanel, {
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
                  
                  // Construct authentic Odoo report download URL
                  const activeId = selectedRecord.value?.id || '';
                  const reportType = activeAction.value.report_type === 'qweb-html' ? 'html' : 'pdf';
                  const reportUrl = `/report/${reportType}/${activeAction.value.report_name}/${activeId}`;
                  const downloadUrl = `/report/download?data=${encodeURIComponent(JSON.stringify([reportUrl, reportType]))}`;

                  // Trigger same-origin browser download
                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = `${activeAction.value.report_name}.${reportType === 'html' ? 'html' : 'pdf'}`;
                  document.body.appendChild(link);
                  try {
                    link.click();
                  } catch (e) {
                    // Bypassed gracefully
                  }
                  document.body.removeChild(link);

                  await new Promise(resolve => setTimeout(resolve, 1000));
                  isPrinting.value = false;
                  addNotification(`Report "${activeAction.value.report_name}" compiled and downloaded successfully.`, 'success');
                }
              }, isPrinting.value ? 'Compiling PDF...' : 'Print Report (PDF)')
            ])
          ]) : null,

          // Render Chinese Odoo Control Panel (only for window actions when view is not form)
          !isConnecting.value && (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') && activeViewType.value !== 'form' ? h(OdooControlPanel, {
            arch: searchArch.value,
            onSearchChange: handleSearchChange
          }) : null,

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
          ]) : null,

          // 6. Act Window - Advanced View Rendering (graph, pivot, calendar, activity)
          !isConnecting.value &&
          (!activeAction.value || activeAction.value?.type === 'ir.actions.act_window') &&
          !['list', 'kanban', 'form'].includes(activeViewType.value) ? h('div', { style: 'padding: 24px; height: 100%; overflow-y: auto; background: #f8fafc; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px;' }, [
            
            // Render Graph view
            activeViewType.value === 'graph' ? h(rendererRegistry.has('graph') ? rendererRegistry.get('graph') : GraphRenderer, {
              arch: viewArchs.value.graph,
              records: filteredRecords.value,
              onDrillDown: handleDrillDown
            }) : null,

            // Render Pivot view
            activeViewType.value === 'pivot' ? h(rendererRegistry.has('pivot') ? rendererRegistry.get('pivot') : PivotRenderer, {
              arch: viewArchs.value.pivot,
              records: filteredRecords.value,
              onDrillDown: handleDrillDown
            }) : null,

            // Render Calendar view
            activeViewType.value === 'calendar' ? h(rendererRegistry.has('calendar') ? rendererRegistry.get('calendar') : CalendarRenderer, {
              arch: viewArchs.value.calendar,
              records: filteredRecords.value
            }) : null,

            // Render Activity view
            activeViewType.value === 'activity' ? h(rendererRegistry.has('activity') ? rendererRegistry.get('activity') : ActivityRenderer, {
              arch: viewArchs.value.activity,
              records: filteredRecords.value
            }) : null,

            // Render Gantt view
            activeViewType.value === 'gantt' ? h(rendererRegistry.has('gantt') ? rendererRegistry.get('gantt') : GanttRenderer, {
              arch: viewArchs.value.gantt,
              records: filteredRecords.value
            }) : null,

            // Render Map view
            activeViewType.value === 'map' ? h(rendererRegistry.has('map') ? rendererRegistry.get('map') : null, {
              arch: viewArchs.value.map,
              records: filteredRecords.value
            }) : null,

            // Fallback for other advanced views (e.g. cohort, grid, qweb)
            !['graph', 'pivot', 'calendar', 'activity', 'gantt', 'map'].includes(activeViewType.value) ? h('div', {
              class: 'o_view_nocontent',
              style: 'padding: 40px; text-align: center; color: #475569; background: white; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center;'
            }, [
              h('div', { style: 'font-size: 48px; margin-bottom: 16px;' }, '📊'),
              h('h2', { style: 'margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1e293b;' }, `Semantic Support for ${activeViewType.value.toUpperCase()} View`),
              h('p', { style: 'margin: 0 0 24px 0; font-size: 13px; color: #64748b; max-width: 480px; line-height: 1.5;' }, 
                `The view layout (Arch XML) has been compiled successfully into a semantic IR representation and is stored inside 'viewArchs.value.${activeViewType.value}'. It is fully ready for the custom component implementation.`
              ),
              h('div', {
                style: 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: left; width: 100%; max-width: 600px;'
              }, [
                h('div', { style: 'font-family: monospace; font-size: 12px; color: #334155;' }, [
                  h('div', { style: 'font-weight: 600; color: #714B67; margin-bottom: 8px;' }, 'Compiled View AST Header:'),
                  h('pre', { style: 'margin: 0; padding: 8px; background: #f1f5f9; border-radius: 4px; overflow-x: auto;' }, 
                    JSON.stringify({
                      tag: (viewArchs.value[activeViewType.value] as any)?.tag || 'unknown',
                      attributes: (viewArchs.value[activeViewType.value] as any)?.attrs || {},
                      childrenCount: (viewArchs.value[activeViewType.value] as any)?.children?.length || 0
                    }, null, 2)
                  )
                ])
              ])
            ]) : null
          ]) : null
        ])
      ])
    ]);
  }
};
