import { defineComponent, h } from 'vue';

export const FieldChar = defineComponent({
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
        return h('span', { class: 'o_field_char o_readonly' }, strVal);
      }

      return h('input', {
        class: 'o_field_char',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldBoolean = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = !!props.record?.get(props.name);

      if (props.readonly) {
        return h('span', { class: 'o_field_boolean o_readonly' }, val ? 'Yes' : 'No');
      }

      return h('input', {
        type: 'checkbox',
        class: 'o_field_boolean',
        checked: val,
        onChange: (e: any) => props.record?.set(props.name, e.target.checked)
      });
    };
  }
});
