import { defineComponent, h, inject } from 'vue';
import { componentRegistry } from '../registry.js';
import { ACTION_MANAGER_KEY } from '../di.js';
import { resolveFieldWidget } from './index.js';

export const ListRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null);

    return () => {
      const archFields = (props.arch?.children || []).filter((child: any) => child.tag === 'field');
      const editable = props.arch?.attrs?.editable;

      const thVNodes = archFields.map((f: any) => h('th', f.attrs?.string || f.attrs?.name || ''));
      const trHeader = h('tr', null, thVNodes);
      const thead = h('thead', null, trHeader);

      const rowVNodes = (props.records || []).map((rec: any) => {
        const tdVNodes = archFields.map((f: any) => {
          const fieldName = f.attrs.name;
          if (editable) {
            const widgetName = resolveFieldWidget(fieldName, rec, f.attrs, 'list');
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('td', null, h(widgetComp, {
              record: rec,
              name: fieldName,
              readonly: false
            }));
          } else {
            const cellVal = rec?.get ? rec.get(fieldName) : (rec[fieldName] || '');
            return h('td', null, h('span', { class: 'o_cell_value' }, String(cellVal)));
          }
        });

        return h('tr', {
          onClick: () => {
            if (!editable && actionManager) {
              actionManager.doAction({
                name: 'Edit Relation Record',
                res_model: 'sub.model',
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
                target: 'new',
                res_id: rec.id
              });
            }
          }
        }, tdVNodes);
      });
      const tbody = h('tbody', null, rowVNodes);

      return h('table', { class: 'o_list_view o_subview_list' }, [thead, tbody]);
    };
  }
});
