import { defineComponent, h } from 'vue';

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
        return h('span', { class: 'o_field_selection o_readonly' }, found ? found[1] : strVal);
      }

      const options = selectionList.map((item: any) => {
        return h('option', { value: item[0] }, item[1]);
      });

      return h('select', {
        class: 'o_field_selection',
        value: strVal,
        onChange: (e: any) => props.record?.set(props.name, e.target.value)
      }, options);
    };
  }
});
