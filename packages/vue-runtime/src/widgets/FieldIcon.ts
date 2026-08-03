import { defineComponent, h, computed } from 'vue';

export const FieldIcon = defineComponent({
  name: 'FieldIcon',
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    const value = computed({
      get: () => props.record?.get(props.name) || '',
      set: (val: string) => props.record?.set(props.name, val)
    });

    return () => {
      const val = value.value;

      if (props.readonly) {
        if (!val) {
          return h('span', { class: 'text-slate-400 italic text-xs' }, '(无图标)');
        }
        // Readonly mode: render clean Font Awesome icon vector
        return h('div', { class: 'flex items-center gap-1.5' }, [
          h('i', { class: `fa ${val}`, style: 'font-size: 16px; color: #475569;' }),
          h('span', { class: 'text-xs text-slate-500 font-mono' }, val)
        ]);
      }

      // Edit mode: input box with dynamic live icon preview prefix
      return h('el-input', {
        modelValue: val,
        'onUpdate:modelValue': (v: string) => { value.value = v; },
        placeholder: '例如: fa-star',
        size: 'small',
        clearable: true,
        style: 'max-width: 240px;'
      }, {
        prefix: () => h('i', {
          class: `fa ${val || 'fa-info-circle'}`,
          style: 'color: #714B67; font-size: 14px; margin-right: 4px;'
        })
      });
    };
  }
});
