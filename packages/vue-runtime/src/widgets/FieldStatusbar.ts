import { defineComponent, h } from 'vue';

export const FieldStatusbar = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    selection: { type: Array, default: () => [] },
    statusbar_visible: { type: String, default: '' }
  },
  setup(props) {
    return () => {
      const activeVal = props.record?.get(props.name);
      const strActiveVal = activeVal !== null && activeVal !== undefined ? String(activeVal) : '';

      let selectionList = (props.selection || []) as [string, string][];

      // Fallback: if no selection list is provided, generate a sensible one from common Odoo states
      if (selectionList.length === 0) {
        selectionList = [
          ['draft', 'Draft'],
          ['sent', 'Sent'],
          ['purchase', 'Purchase Order'],
          ['done', 'Locked / Done'],
          ['cancel', 'Cancelled']
        ];
      }

      // Filter based on statusbar_visible if provided
      let visibleKeys: string[] = [];
      if (props.statusbar_visible) {
        visibleKeys = props.statusbar_visible.split(',').map(s => s.trim());
      }

      const visibleStages = selectionList.filter(item => {
        const key = item[0];
        if (key === strActiveVal) return true; // Always show current stage
        if (visibleKeys.length > 0) return visibleKeys.includes(key);
        return true;
      });

      const stageNodes = visibleStages.map((item, index) => {
        const key = item[0];
        const label = item[1];
        const isActive = key === strActiveVal;

        const stageStyle = isActive
          ? 'background-color: #714B67; color: white; padding: 4px 12px; font-weight: bold; border-radius: 4px; display: inline-flex; align-items: center;'
          : 'color: #64748b; padding: 4px 8px; cursor: pointer; display: inline-flex; align-items: center; transition: all 0.15s;';

        const nodes = [
          h('span', {
            style: stageStyle,
            onClick: () => props.record?.set(props.name, key)
          }, label)
        ];

        if (index < visibleStages.length - 1) {
          nodes.push(h('span', { style: 'margin: 0 6px; color: #cbd5e1; font-weight: bold;' }, '▶'));
        }

        return nodes;
      }).flat();

      return h('div', {
        class: 'o_statusbar_status',
        style: 'display: flex; align-items: center; flex-wrap: wrap; gap: 4px;'
      }, stageNodes);
    };
  }
});
