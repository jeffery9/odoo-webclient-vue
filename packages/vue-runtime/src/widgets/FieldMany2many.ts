import { defineComponent, h } from 'vue';
import { ListRenderer, CardRenderer } from '../renderers/index.js';
import { viewRegistry } from '../registry.js';

export const FieldMany2many = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    relation: { type: String, default: '' },
    subViews: { type: Array, default: () => [] }
  },
  setup(props) {
    return () => {
      const treeNode = (props.subViews || []).find((v: any) => v.tag === 'tree' || v.tag === 'list');
      const cardNode = (props.subViews || []).find((v: any) => v.tag === 'card');
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];

      let activeArch = treeNode;
      if (!activeArch && !cardNode) {
        const targetModel = props.relation || childRecords[0]?.modelName || '';
        const defaultListArch = targetModel && viewRegistry.has(`${targetModel}/list`) ? viewRegistry.get(`${targetModel}/list`) : null;
        
        activeArch = defaultListArch || {
          tag: 'tree',
          children: [
            { tag: 'field', attrs: { name: 'id', string: 'ID' } },
            { tag: 'field', attrs: { name: 'display_name', string: 'Name' } }
          ]
        };
      }

      if (activeArch) {
        return h(ListRenderer, { arch: activeArch, records: childRecords });
      }

      if (cardNode) {
        return h(CardRenderer, { arch: cardNode, records: childRecords });
      }
    };
  }
});
