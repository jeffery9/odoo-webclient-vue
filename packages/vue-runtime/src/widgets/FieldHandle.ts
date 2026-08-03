import { defineComponent, h } from 'vue';

export const FieldHandle = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      return h('span', {
        class: 'o_row_handle',
        style: 'cursor: grab; display: inline-block; padding: 4px; color: #94a3b8; font-size: 14px;'
      }, '☰');
    };
  }
});
