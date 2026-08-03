import { defineComponent, h, ref, computed, onMounted } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { TAG_COLORS } from './tagColors.js';

export const FieldTag = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    relation: { type: String, default: '' }
  },
  setup(props) {
    const isLoading = ref(false);
    const tagSuggestions = ref<{ id: number; display_name: string }[]>([]);

    const childRecords = computed(() => {
      const val = props.record?.get(props.name) || [];
      return Array.isArray(val) ? val : [];
    });

    const selectedIds = computed(() => {
      return childRecords.value.map((rec: any) => {
        return rec?.get ? rec.get('id') : (Array.isArray(rec) ? rec[0] : rec?.id);
      });
    });

    const search = async (q: string) => {
      const session = props.record?.model?.session;
      if (session?.rpc) {
        isLoading.value = true;
        try {
          const relationModel = props.relation || 'res.partner.category';
          const res = await session.rpc({
            model: relationModel,
            method: 'search_read',
            args: [[['name', 'ilike', q]], ['name', 'display_name']]
          });
          if (Array.isArray(res)) {
            tagSuggestions.value = res.map((r: any) => ({
              id: r.id,
              display_name: r.display_name || r.name || ''
            }));
          }
        } catch (e) {
          // fallback silently for standalone runs
        } finally {
          isLoading.value = false;
        }
      }
    };

    const getColor = (rec: any) => {
      const id = rec?.id || (rec?.get ? rec.get('id') : null) || (Array.isArray(rec) ? rec[0] : 0) || 0;
      return TAG_COLORS[id % TAG_COLORS.length];
    };

    onMounted(() => {
      search('');
    });

    return () => {
      if (props.readonly) {
        return h('div', {
          class: 'o_field_tags o_readonly',
          style: 'display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0;'
        }, childRecords.value.map((rec: any) => {
          const nameVal = rec?.get 
            ? rec.get('display_name') || rec.get('name') 
            : (Array.isArray(rec) ? rec[1] : rec?.display_name || rec?.name || String(rec));
          const color = getColor(rec);
          return h('span', {
            class: 'o_tag_pill',
            style: `background: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500;`
          }, String(nameVal));
        }));
      }

      return h('div', {
        class: 'o_field_tags o_field_widget',
        style: {
          '--el-color-primary': '#714B67',
          '--el-color-primary-light-9': '#f3eff2',
          '--el-border-radius-base': '6px',
          width: '100%',
          display: 'inline-block'
        }
      }, [
        h(ElSelect, {
          modelValue: selectedIds.value,
          multiple: true,
          filterable: true,
          remote: true,
          allowCreate: true,
          defaultFirstOption: true,
          placeholder: childRecords.value.length === 0 ? 'Search or create tag...' : '',
          loading: isLoading.value,
          remoteMethod: search,
          style: { width: '100%' },
          class: 'o_field_many2many_tags_select',
          'onUpdate:modelValue': (newIds: any[]) => {
            const updated = newIds.map((idVal) => {
              if (typeof idVal === 'string') {
                // Created on the fly!
                return {
                  id: Math.floor(Math.random() * 100000) + 1,
                  display_name: idVal,
                  name: idVal
                };
              }
              const found = childRecords.value.find((rec: any) => {
                const rId = rec?.get ? rec.get('id') : (Array.isArray(rec) ? rec[0] : rec?.id);
                return rId === idVal;
              });
              if (found) return found;
              const suggestion = tagSuggestions.value.find(sug => sug.id === idVal);
              return suggestion || { id: idVal, display_name: String(idVal), name: String(idVal) };
            });
            props.record?.set(props.name, updated);
          }
        }, () => [
          ...tagSuggestions.value.map(s => h(ElOption, {
            key: s.id,
            label: s.display_name,
            value: s.id
          }))
        ])
      ]);
    };
  }
});
