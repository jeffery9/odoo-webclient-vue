import { defineComponent, h } from 'vue';

export const FieldBadge = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      return h('span', {
        class: 'o_badge',
        style: 'display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 12px; background-color: #e2e8f0; color: #475569;'
      }, strVal);
    };
  }
});
