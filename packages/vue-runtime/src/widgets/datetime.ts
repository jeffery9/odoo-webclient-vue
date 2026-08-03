import { defineComponent, h } from 'vue';

export const FieldDate = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val).split(' ')[0] : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_date o_readonly' }, strVal);
      }

      return h('input', {
        type: 'date',
        class: 'o_field_date',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldDatetime = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val).replace(' ', 'T') : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_datetime o_readonly' }, strVal.replace('T', ' '));
      }

      return h('input', {
        type: 'datetime-local',
        class: 'o_field_datetime',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value.replace('T', ' '))
      });
    };
  }
});
