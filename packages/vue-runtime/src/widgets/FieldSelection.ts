import { defineComponent, h } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export const FieldSelection = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    selection: { type: Array, default: () => [] } // array of [value, label]
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      const selectionList = (props.selection || []) as any[];

      if (props.readonly) {
        const found = selectionList.find((item: any) => item[0] === strVal);
        return h('span', { class: 'o_field_selection o_readonly', style: { fontWeight: '500' } }, found ? found[1] : strVal);
      }

      return h('div', {
        class: 'o_field_selection o_field_widget',
        style: {
          '--el-color-primary': '#714B67',
          '--el-color-primary-light-9': '#f3eff2',
          '--el-border-radius-base': '6px',
          width: '100%',
          display: 'inline-block'
        }
      }, [
        h(ElSelect, {
          modelValue: strVal,
          placeholder: 'Select...',
          style: { width: '100%' },
          class: 'o_field_selection_select',
          'onUpdate:modelValue': (newVal: any) => {
            props.record?.set(props.name, newVal);
          }
        }, () => [
          ...selectionList.map((item: any) => h(ElOption, {
            key: item[0],
            label: item[1],
            value: item[0]
          }))
        ])
      ]);
    };
  }
});
