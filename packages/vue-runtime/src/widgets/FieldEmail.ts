import { defineComponent, h } from 'vue';

export const FieldEmail = defineComponent({
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
        return h('a', { class: 'o_field_email o_readonly', href: 'mailto:' + strVal, style: 'color: #00878a; text-decoration: underline;' }, strVal);
      }

      return h('input', {
        type: 'email',
        class: 'o_field_email',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});
