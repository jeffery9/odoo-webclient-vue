import { defineComponent, h } from 'vue';
import { useOdooField } from '../composables/useOdooField.js';

export const FieldChar = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const { value, isReadonly, isRequired, isInvisible, errors } = useOdooField(props);

    return () => {
      if (isInvisible.value) {
        return null;
      }

      if (isReadonly.value) {
        return h('span', { class: 'o_field_char_readonly text-slate-700' }, value.value || '');
      }

      return h('input', {
        class: 'o_field_char',
        value: value.value || '',
        onInput: (e: any) => {
          value.value = e.target.value;
        }
      });
    };
  }
});
