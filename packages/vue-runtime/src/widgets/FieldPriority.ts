import { defineComponent, h } from 'vue';

export const FieldPriority = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const rating = Math.min(5, Math.max(0, Math.round(Number(val) || 0)));

      const stars = Array.from({ length: 5 }, (_, i) => {
        const active = i < rating;
        return h('i', {
          class: active ? 'fa fa-star' : 'fa fa-star-o',
          style: `cursor: ${props.readonly ? 'default' : 'pointer'}; font-size: 16px; color: ${active ? '#f59e0b' : '#cbd5e1'}; margin-right: 4px;`,
          onClick: () => {
            if (!props.readonly) {
              props.record?.set(props.name, i + 1);
            }
          }
        });
      });

      return h('div', { class: 'o_priority flex items-center' }, stars);
    };
  }
});
