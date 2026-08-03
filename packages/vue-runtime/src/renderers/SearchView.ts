import { h, defineComponent, ref, computed, watch, onMounted } from 'vue';
import { Expression } from '@odoo/sdk';

const FIELD_RELATIONS: Record<string, string> = {
  category_id: 'res.partner.category',
  user_id: 'res.users',
  company_id: 'res.company'
};

// Reusable Multi-Criteria SearchView Component
export const SearchView = defineComponent({
  name: 'SearchView',
  props: {
    arch: { type: Object, required: true },
    fieldValues: { type: Object, required: true },
    activeFilters: { type: Array, required: true },
    activeGroupBys: { type: Array, required: true },
    activeClient: { type: Object, required: false },
    activeContext: { type: Object, required: false }
  },
  emits: ['update:fieldValues', 'update:activeFilters', 'update:activeGroupBys', 'searchChange'],
  setup(props, { emit }) {
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

    const loadRelationalChoices = async () => {
      if (!props.activeClient) {
        // Fallback mockup items for offline or testing mode
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
            const records = await props.activeClient.search_read(
              relationModel,
              [],
              ['name'],
              undefined,
              undefined,
              props.activeContext || {}
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

    const emitSearchState = () => {
      const domains: any[] = [];
      const groupByFields: string[] = [];

      // A. Explicit search criteria fields
      for (const f of searchFields.value) {
        const name = f.attrs.name;
        const val = props.fieldValues[name];
        if (val !== undefined && val !== null && val !== '') {
          const relationModel = FIELD_RELATIONS[name];
          if (relationModel || typeof val === 'number') {
            domains.push([name, '=', val]);
          } else {
            domains.push([name, 'like', val]);
          }
        }
      }

      // B. Predefined Filters
      props.activeFilters.forEach((filterName: any) => {
        const filterNode = odooFilters.value.find((f: any) => f.attrs.name === filterName);
        if (filterNode && filterNode.attrs.domain) {
          try {
            const cleanDomainStr = filterNode.attrs.domain.replace(/'/g, '"');
            const parsedDomain = JSON.parse(cleanDomainStr);
            if (Array.isArray(parsedDomain)) {
              domains.push(...parsedDomain);
            }
          } catch (e) {}
        }
      });

      // C. Predefined GroupBys
      props.activeGroupBys.forEach((filterName: any) => {
        const filterNode = odooGroupBys.value.find((f: any) => f.attrs.name === filterName);
        if (filterNode && filterNode.attrs.context) {
          const field = parseGroupByField(filterNode.attrs.context);
          if (field) groupByFields.push(field);
        }
      });

      emit('searchChange', { domain: domains, groupBy: groupByFields });
    };

    onMounted(loadRelationalChoices);
    watch(() => props.arch, loadRelationalChoices, { deep: true });

    // Re-emit whenever inner search bindings modify
    watch(() => props.fieldValues, emitSearchState, { deep: true });
    watch(() => props.activeFilters, emitSearchState, { deep: true });
    watch(() => props.activeGroupBys, emitSearchState, { deep: true });

    return () => {
      const fields = searchFields.value;
      const filters = odooFilters.value;
      const groupBys = odooGroupBys.value;

      return h('div', {
        class: 'o_odoo_search_view flex flex-col gap-4'
      }, [
        // 1. Title
        h('div', { class: 'text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2' }, [
          h('span', null, '🔍 显式多条件快捷检索')
        ]),

        // 2. Explicit Search Inputs Grid
        fields.length > 0 ? h('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-2' }, fields.map((f: any) => {
          const name = f.attrs.name;
          const label = f.attrs.string || name.replace('_id', '').toUpperCase();
          const relationModel = FIELD_RELATIONS[name];

          const inputWidget = relationModel 
            ? h('el-select', {
                modelValue: props.fieldValues[name],
                'onUpdate:modelValue': (val: any) => {
                  const next = { ...props.fieldValues, [name]: val };
                  emit('update:fieldValues', next);
                },
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
                modelValue: props.fieldValues[name],
                'onUpdate:modelValue': (val: string) => {
                  const next = { ...props.fieldValues, [name]: val };
                  emit('update:fieldValues', next);
                },
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

        // 3. Filters checkbox buttons
        filters.length > 0 ? h('div', { class: 'flex flex-col gap-2 border-t border-slate-50 pt-2' }, [
          h('span', { class: 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider' }, '快捷过滤 (Quick Filters)'),
          h('el-checkbox-group', {
            modelValue: props.activeFilters,
            'onUpdate:modelValue': (val: string[]) => { emit('update:activeFilters', val); },
            size: 'small'
          }, filters.map((f: any) => h('el-checkbox-button', {
            key: f.attrs.name,
            label: f.attrs.name
          }, f.attrs.string || f.attrs.name)))
        ]) : null,

        // 4. GroupBy checkbox buttons
        groupBys.length > 0 ? h('div', { class: 'flex flex-col gap-2 border-t border-slate-50 pt-2' }, [
          h('span', { class: 'text-[11px] font-semibold text-slate-400 uppercase tracking-wider' }, '数据分组 (Group By)'),
          h('el-checkbox-group', {
            modelValue: props.activeGroupBys,
            'onUpdate:modelValue': (val: string[]) => { emit('update:activeGroupBys', val); },
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

// Reusable Hierarchical Sidebar SearchPanel Component
export const SearchPanelRenderer = defineComponent({
  name: 'SearchPanelRenderer',
  props: {
    arch: { type: Object, required: true },
    activeClient: { type: Object, required: false },
    activeContext: { type: Object, required: false }
  },
  emits: ['filterChange'],
  setup(props, { emit }) {
    const selections = ref<Record<string, any[]>>({});
    const fieldTrees = ref<Record<string, any[]>>({});

    const getSearchFields = () => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      const panel = props.arch.children?.find((c: any) => c.tag === 'searchpanel');
      if (!panel) return [];
      return panel.children?.filter((c: any) => c.tag === 'field') || [];
    };

    const buildHierarchy = (records: any[]): any[] => {
      const recordMap: Record<number, any> = {};
      const roots: any[] = [];

      records.forEach((r) => {
        recordMap[r.id] = {
          id: r.id,
          label: r.name || r.display_name || `ID ${r.id}`,
          children: []
        };
      });

      records.forEach((r) => {
        const mapped = recordMap[r.id];
        const parentId = Array.isArray(r.parent_id) ? r.parent_id[0] : r.parent_id;

        if (parentId && recordMap[parentId]) {
          recordMap[parentId].children.push(mapped);
        } else {
          roots.push(mapped);
        }
      });

      return roots;
    };

    const loadFieldTrees = async () => {
      const fields = getSearchFields();

      if (!props.activeClient) {
        // Fallback offline trees for unit tests / demo mode
        fields.forEach((f: any) => {
          const name = f.attrs.name;
          if (name === 'category_id') {
            fieldTrees.value[name] = [
              { id: 1, label: 'VIP Clients', children: [] },
              { id: 2, label: 'Standard Partners', children: [] }
            ];
          }
        });
        return;
      }

      for (const f of fields) {
        const name = f.attrs.name;
        const relationModel = FIELD_RELATIONS[name];
        if (relationModel) {
          try {
            const records = await props.activeClient.search_read(
              relationModel,
              [],
              ['name', 'parent_id'],
              undefined,
              undefined,
              props.activeContext || {}
            );
            fieldTrees.value[name] = buildHierarchy(records);
          } catch (e) {
            fieldTrees.value[name] = [];
          }
        }
      }
    };

    const handleNodeCheck = (fieldName: string, checkedKeys: any[]) => {
      selections.value[fieldName] = checkedKeys;

      const domains: any[] = [];
      for (const [key, selectedIds] of Object.entries(selections.value)) {
        if (selectedIds && selectedIds.length > 0) {
          if (selectedIds.length === 1) {
            domains.push([key, '=', selectedIds[0]]);
          } else {
            const orList: any[] = [];
            for (let i = 0; i < selectedIds.length - 1; i++) {
              orList.push('|');
            }
            selectedIds.forEach((id) => orList.push([key, '=', id]));
            domains.push(...orList);
          }
        }
      }

      emit('filterChange', domains);
    };

    onMounted(loadFieldTrees);
    watch(() => props.arch, loadFieldTrees, { deep: true });

    return () => {
      const fields = getSearchFields();
      if (fields.length === 0) return null;

      return h('aside', {
        class: 'o_search_panel_renderer',
        style: 'width: 260px; background: white; border-right: 1px solid #e2e8f0; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px;'
      }, [
        h('div', {
          style: 'font-size: 14px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; display: flex; align-items: center; gap: 8px;'
        }, [
          h('span', null, '📂 层级过滤面板')
        ]),

        ...fields.map((f: any) => {
          const name = f.attrs.name;
          const label = f.attrs.string || name.replace('_id', '').toUpperCase();
          const treeData = fieldTrees.value[name] || [];

          return h('div', { key: name, style: 'display: flex; flex-direction: column; gap: 10px;' }, [
            h('div', {
              style: 'font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;'
            }, label),

            h('el-tree', {
              data: treeData,
              showCheckbox: true,
              nodeKey: 'id',
              defaultExpandAll: true,
              props: {
                label: 'label',
                children: 'children'
              },
              onCheck: (node: any, checkState: any) => {
                handleNodeCheck(name, checkState.checkedKeys);
              },
              style: 'font-size: 13px; color: #334155; --el-tree-node-hover-bg-color: #f1f5f9; --el-color-primary: #714B67;'
            })
          ]);
        })
      ]);
    };
  }
});
