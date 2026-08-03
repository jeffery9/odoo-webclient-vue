import { defineComponent, h } from 'vue';

export const FieldText = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_text o_readonly', style: 'white-space: pre-wrap' }, strVal);
      }

      return h('textarea', {
        class: 'o_field_text',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});
