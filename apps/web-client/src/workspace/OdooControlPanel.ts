import { h, defineComponent, ref, computed, watch, onMounted } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';

const FIELD_RELATIONS: Record<string, string> = {
  category_id: 'res.partner.category',
  user_id: 'res.users',
  company_id: 'res.company'
};

export const OdooControlPanel = defineComponent({
  name: 'OdooControlPanel',
  props: {
    arch: { type: Object, required: true },
    onSearchChange: { type: Function, required: true }
  },
  setup(props) {
    const fieldValues = ref<Record<string, any>>({});
    const activeFilters = ref<string[]>([]);
    const activeGroupBys = ref<string[]>([]);
    
    // Maintain dropdown choices for relational fields
    const relationChoices = ref<Record<string, { id: number; name: string }[]>>({});

    const searchFields = computed(() => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      return props.arch.children?.filter((c: any) => c.tag === 'field') || [];
    });

    const odooFilters = computed(() => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      return props.arch.children?.filter((c: any) => c.tag === 'filter' && !c.attrs.context?.includes('group_by')) || [];
    });

    const odooGroupBys = computed(() => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      return props.arch.children?.filter((c: any) => c.tag === 'filter' && c.attrs.context?.includes('group_by')) || [];
    });

    const parseGroupByField = (contextStr: string): string => {
      if (!contextStr) return '';
      const match = /'group_by':\s*'([^']+)'/.exec(contextStr) || /"group_by":\s*"([^"]+)"/.exec(contextStr);
      return match ? match[1] : '';
    };

    // Load options for relational select inputs
    const loadRelationalChoices = async () => {
      if (!activeClient.value) {
        // Fallback mockup items for local/unconnected mode or unit testing
        searchFields.value.forEach((f: any) => {
          const name = f.attrs.name;
          if (name === 'category_id') {
            relationChoices.value[name] = [
              { id: 1, name: 'VIP Clients' },
              { id: 2, name: 'Standard Partners' }
            ];
          } else if (name === 'user_id') {
            relationChoices.value[name] = [
              { id: 1, name: 'Administrator' },
              { id: 2, name: 'Demo User' }
            ];
          } else if (name === 'company_id') {
            relationChoices.value[name] = [
              { id: 1, name: 'San Francisco HQ' },
              { id: 2, name: 'Chicago Branch' }
            ];
          }
        });
        return;
      }

      for (const f of searchFields.value) {
        const name = f.attrs.name;
        const relationModel = FIELD_RELATIONS[name];
        if (relationModel) {
          try {
            const records = await activeClient.value.search_read(
              relationModel,
              [],
              ['name'],
              undefined,
              undefined,
              activeContext.value
            );
            relationChoices.value[name] = records.map((r: any) => ({
              id: r.id,
              name: r.name || r.display_name
            }));
          } catch (e) {
            relationChoices.value[name] = [];
          }
        }
      }
    };

    const updateSearchState = () => {
      const domains: any[] = [];
      const groupByFields: string[] = [];

      // A. Explicit search criteria field values
      for (const f of searchFields.value) {
        const name = f.attrs.name;
        const val = fieldValues.value[name];
        if (val !== undefined && val !== null && val !== '') {
          const relationModel = FIELD_RELATIONS[name];
          if (relationModel || typeof val === 'number') {
            // Relational select: exact match
            domains.push([name, '=', val]);
          } else {
            // Char/text fields: dynamic like query
            domains.push([name, 'like', val]);
          }
        }
      }

      // B. Quick Filters
      activeFilters.value.forEach((filterName) => {
        const filterNode = odooFilters.value.find((f: any) => f.attrs.name === filterName);
        if (filterNode && filterNode.attrs.domain) {
          try {
            const cleanDomainStr = filterNode.attrs.domain.replace(/'/g, '"');
            const parsedDomain = JSON.parse(cleanDomainStr);
            if (Array.isArray(parsedDomain)) {
              domains.push(...parsedDomain);
            }
          } catch (e) {
            // Safe fallback
          }
        }
      });

      // C. Predefined Group Bys
      activeGroupBys.value.forEach((filterName) => {
        const filterNode = odooGroupBys.value.find((f: any) => f.attrs.name === filterName);
        if (filterNode && filterNode.attrs.context) {
          const field = parseGroupByField(filterNode.attrs.context);
          if (field) groupByFields.push(field);
        }
      });

      props.onSearchChange({
        domain: domains,
        groupBy: groupByFields
      });
    };

    onMounted(loadRelationalChoices);
    watch(() => props.arch, loadRelationalChoices, { deep: true });

    // Instantly execute search on any change
    watch([fieldValues, activeFilters, activeGroupBys], () => {
      updateSearchState();
    }, { deep: true });

    return () => {
      const fields = searchFields.value;
      const filters = odooFilters.value;
      const groupBys = odooGroupBys.value;

      return h('div', {
        class: 'o_odoo_control_panel bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-6 flex flex-col gap-4'
      }, [
        // 1. Title
        h('div', { class: 'text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2' }, [
          h('span', null, '🔍 显式多条件快捷检索')
        ]),

        // 2. Explicit Search Input Grid (3-column layout)
        fields.length > 0 ? h('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-2' }, fields.map((f: any) => {
            const name = f.attrs.name;
            const label = f.attrs.string || name.replace('_id', '').toUpperCase();
            const relationModel = FIELD_RELATIONS[name];

            const inputWidget = relationModel 
              ? h('el-select', {
                  modelValue: fieldValues.value[name],
                  'onUpdate:modelValue': (val: any) => { fieldValues.value[name] = val; },
                  placeholder: `选择${label}`,
                  clearable: true,
                  size: 'small',
                  style: 'width: 100%'
                }, (relationChoices.value[name] || []).map((opt) => h('el-option', {
                  key: opt.id,
                  value: opt.id,
                  label: opt.name
                })))
              : h('el-input', {
                  modelValue: fieldValues.value[name],
                  'onUpdate:modelValue': (val: string) => { fieldValues.value[name] = val; },
                  placeholder: `搜索${label}...`,
                  clearable: true,
                  size: 'small',
                  style: 'width: 100%'
                });

            return h('div', { key: name, class: 'flex flex-col gap-1' }, [
              h('label', { class: 'text-[11px] font-semibold text-slate-500 uppercase tracking-wider' }, label),
              inputWidget
            ]);
          })) : null,

        // 3. Quick Filters Row (Checkbox buttons)
        filters.length > 0 ? h('div', { class: 'flex flex-col gap-2 border-t border-slate-50 pt-2' }, [
          h('span', { class: 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider' }, '快捷过滤 (Quick Filters)'),
          h('el-checkbox-group', {
            modelValue: activeFilters.value,
            'onUpdate:modelValue': (val: string[]) => { activeFilters.value = val; },
            size: 'small'
          }, filters.map((f: any) => h('el-checkbox-button', {
            key: f.attrs.name,
            label: f.attrs.name
          }, f.attrs.string || f.attrs.name)))
        ]) : null,

        // 4. Group By Row (Checkbox buttons)
        groupBys.length > 0 ? h('div', { class: 'flex flex-col gap-2 border-t border-slate-50 pt-2' }, [
          h('span', { class: 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider' }, '数据分组 (Group By)'),
          h('el-checkbox-group', {
            modelValue: activeGroupBys.value,
            'onUpdate:modelValue': (val: string[]) => { activeGroupBys.value = val; },
            size: 'small'
          }, groupBys.map((f: any) => h('el-checkbox-button', {
            key: f.attrs.name,
            label: f.attrs.name
          }, f.attrs.string || f.attrs.name)))
        ]) : null
      ]);
    };
  }
});
