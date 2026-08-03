import { defineComponent, h, computed } from 'vue';
import { useOdooRelationField } from '../composables/useOdooRelationField.js';
import { ElSelect, ElOption } from 'element-plus';

export const FieldMany2one = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) },
    context: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const {
      value,
      isReadonly,
      isInvisible,
      suggestions,
      isLoading,
      search,
      select,
      openRelationForm
    } = useOdooRelationField(props);

    const id = computed(() => {
      const val = value.value;
      return Array.isArray(val) ? val[0] : null;
    });

    const name = computed(() => {
      const val = value.value;
      return Array.isArray(val) ? val[1] : '';
    });

    return () => {
      if (isInvisible.value) {
        return null;
      }

      if (isReadonly.value) {
        if (id.value !== null && id.value !== undefined && id.value !== false) {
          return h(
            'a',
            {
              class: 'o_field_many2one o_readonly',
              style: {
                color: '#714B67',
                cursor: 'pointer',
                fontWeight: '600',
                textDecoration: 'underline'
              },
              onClick: () => openRelationForm(id.value as number)
            },
            name.value
          );
        }
        return h('span', { class: 'o_field_many2one o_readonly', style: { color: '#94a3b8', fontWeight: '300' } }, '—');
      }

      return h('div', {
        class: 'o_field_many2one o_field_widget',
        style: {
          '--el-color-primary': '#714B67',
          '--el-color-primary-light-9': '#f3eff2',
          '--el-border-radius-base': '6px',
          width: '100%',
          display: 'inline-block'
        }
      }, [
        h(ElSelect, {
          modelValue: id.value,
          filterable: true,
          remote: true,
          placeholder: 'Search...',
          loading: isLoading.value,
          remoteMethod: (query: string) => {
            search(query);
          },
          'onUpdate:modelValue': (newId: any) => {
            if (newId === '__create__') {
              openRelationForm();
            } else {
              const found = suggestions.value.find(s => s.id === newId);
              if (found) {
                select(found.id, found.display_name);
              }
            }
          },
          style: { width: '100%' },
          class: 'o_field_many2one_select'
        }, () => [
          ...suggestions.value.map(s => h(ElOption, {
            key: s.id,
            label: s.display_name,
            value: s.id
          })),
          h(ElOption, {
            key: '__create__',
            label: '+ Create and Edit...',
            value: '__create__',
            style: {
              color: '#714B67',
              fontWeight: '600',
              borderTop: '1px solid #f1f5f9'
            }
          })
        ])
      ]);
    };
  }
});
