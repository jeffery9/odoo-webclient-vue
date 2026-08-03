import { defineComponent, h, inject } from 'vue';
import { componentRegistry } from '../registry.js';
import { ACTION_MANAGER_KEY } from '../di.js';

export const CardRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null);

    return () => {
      const cardFields = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
      const cards = (props.records || []).map((childRec: any) => {
        const fieldsVNodes = cardFields.map((f: any) => {
          const fieldName = f.attrs.name;
          const widgetName = f.attrs.widget || 'char';
          const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
          return h('div', { class: 'o_card_field', style: 'margin-bottom: 4px;' }, [
            h('strong', { style: 'margin-right: 4px;' }, f.attrs?.string || fieldName),
            h(widgetComp, { record: childRec, name: fieldName, readonly: true })
          ]);
        });

        return h('div', {
          class: 'o_subview_card',
          style: 'border: 1px solid #ddd; padding: 12px; border-radius: 6px; flex: 1 1 200px; cursor: pointer;',
          onClick: () => {
            if (actionManager) {
              actionManager.doAction({
                name: 'Edit Relation Card',
                res_model: 'sub.model',
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
                target: 'new',
                res_id: childRec.id
              });
            }
          }
        }, fieldsVNodes);
      });

      return h('div', { class: 'o_card_grid', style: 'display: flex; flex-wrap: wrap; gap: 12px;' }, cards);
    };
  }
});
