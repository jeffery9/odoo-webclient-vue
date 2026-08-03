import { defineComponent, h } from 'vue';

export const FieldInteger = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0;

      if (props.readonly) {
        return h('span', { class: 'o_field_number o_readonly' }, String(numVal));
      }

      return h('input', {
        type: 'number',
        step: '1',
        class: 'o_field_number',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Math.round(Number(e.target.value)))
      });
    };
  }
});

export const FieldFloat = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0.0;

      if (props.readonly) {
        return h('span', { class: 'o_field_number o_readonly' }, String(numVal));
      }

      return h('input', {
        type: 'number',
        step: 'any',
        class: 'o_field_number',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Number(e.target.value))
      });
    };
  }
});

export const FieldMonetary = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0.0;

      if (props.readonly) {
        return h('span', { class: 'o_field_number o_readonly' }, String(numVal));
      }

      return h('input', {
        type: 'number',
        step: 'any',
        class: 'o_field_number',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Number(e.target.value))
      });
    };
  }
});

export const FieldPercentage = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const percentValue = Math.round((Number(val) || 0) * 100);

      if (props.readonly) {
        return h('span', { class: 'o_field_percentage o_readonly' }, `${percentValue}%`);
      }

      return h('div', {
        class: 'o_field_percentage_input',
        style: 'display: flex; align-items: center; gap: 4px;'
      }, [
        h('input', {
          type: 'number',
          step: 'any',
          class: 'o_field_percentage',
          value: percentValue,
          onInput: (e: any) => props.record?.set(props.name, Number(e.target.value) / 100)
        }),
        h('span', null, '%')
      ]);
    };
  }
});
