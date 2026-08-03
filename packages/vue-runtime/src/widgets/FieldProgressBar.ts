import { defineComponent, h } from 'vue';

export const FieldProgressBar = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const percent = Math.min(100, Math.max(0, Number(val) || 0));

      return h('div', {
        class: 'o_progress_bar_container',
        style: 'width: 100%; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; align-items: center;'
      }, [
        h('div', {
          class: 'o_progress_bar',
          style: `width: ${percent}%; background-color: #00878a; color: white; text-align: center; font-size: 10px; padding: 2px 0; transition: width 0.3s ease;`
        }, `${percent}%`)
      ]);
    };
  }
});
