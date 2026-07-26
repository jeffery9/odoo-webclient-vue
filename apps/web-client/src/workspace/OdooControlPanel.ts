import { h, defineComponent, ref, computed, onMounted } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';
import PinyinMatch from 'pinyin-match';

// Define relations for Odoo selection and tree bindings
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
    const searchQuery = ref('');
    const selectedFields = ref<string[]>([]);
    const activeFilters = ref<Record<string, boolean>>({});
    const activeGroupBys = ref<Record<string, boolean>>({});
    const favorites = ref<{ name: string; domain: any[]; groupBy: string[] }[]>([]);
    
    // Custom Filter state
    const customFilterField = ref('');
    const customFilterOperator = ref('=');
    const customFilterValue = ref('');
    const customFilters = ref<{ field: string; op: string; val: any; label: string }[]>([]);

    // Custom Group By state
    const customGroupByField = ref('');
    const customGroupBysList = ref<string[]>([]);

    // Dropdown open states
    const showCustomFilterDialog = ref(false);

    // 1. Extract Search View Elements from Compiled Arch
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

    // Helper: Parse Odoo context group_by field name
    const parseGroupByField = (contextStr: string): string => {
      if (!contextStr) return '';
      const match = /'group_by':\s*'([^']+)'/.exec(contextStr) || /"group_by":\s*"([^"]+)"/.exec(contextStr);
      return match ? match[1] : '';
    };

    // 2. Compute the composite domain, group_by context, and emit search changes
    const updateSearchState = () => {
      const domains: any[] = [];
      const groupByFields: string[] = [];

      // A. Text Search Query (Fuzzy matching on active fields)
      if (searchQuery.value && searchFields.value.length > 0) {
        const queryDomains: any[] = [];
        const targetFields = selectedFields.value.length > 0 
          ? selectedFields.value 
          : [searchFields.value[0].attrs.name]; // Default to first field

        targetFields.forEach((field) => {
          queryDomains.push([field, 'like', searchQuery.value]);
        });

        if (queryDomains.length > 1) {
          // Wrap in OR operations for multiple selected fields
          const orWrapped: any[] = [];
          for (let i = 0; i < queryDomains.length - 1; i++) {
            orWrapped.push('|');
          }
          orWrapped.push(...queryDomains);
          domains.push(...orWrapped);
        } else if (queryDomains.length === 1) {
          domains.push(queryDomains[0]);
        }
      }

      // B. Pre-defined Odoo Filters
      odooFilters.value.forEach((f: any) => {
        const filterName = f.attrs.name;
        if (activeFilters.value[filterName] && f.attrs.domain) {
          try {
            const cleanDomainStr = f.attrs.domain.replace(/'/g, '"');
            const parsedDomain = JSON.parse(cleanDomainStr);
            if (Array.isArray(parsedDomain)) {
              domains.push(...parsedDomain);
            }
          } catch (e) {
            // Safe fallback
          }
        }
      });

      // C. Custom Filters
      customFilters.value.forEach((cf) => {
        domains.push([cf.field, cf.op, cf.val]);
      });

      // D. Pre-defined Group Bys
      odooGroupBys.value.forEach((f: any) => {
        const filterName = f.attrs.name;
        if (activeGroupBys.value[filterName]) {
          const field = parseGroupByField(f.attrs.context);
          if (field) groupByFields.push(field);
        }
      });

      // E. Custom Group Bys
      customGroupBysList.value.forEach((field) => {
        if (!groupByFields.includes(field)) {
          groupByFields.push(field);
        }
      });

      props.onSearchChange({
        domain: domains,
        groupBy: groupByFields
      });
    };

    // 3. Custom Filters Actions
    const addCustomFilter = () => {
      if (!customFilterField.value || !customFilterValue.value) return;
      
      const fieldNode = searchFields.value.find((f: any) => f.attrs.name === customFilterField.value);
      const fieldLabel = fieldNode?.attrs?.string || customFilterField.value;

      customFilters.value.push({
        field: customFilterField.value,
        op: customFilterOperator.value,
        val: customFilterValue.value,
        label: `${fieldLabel} ${customFilterOperator.value} ${customFilterValue.value}`
      });

      customFilterValue.value = '';
      showCustomFilterDialog.value = false;
      updateSearchState();
    };

    const removeCustomFilter = (index: number) => {
      customFilters.value.splice(index, 1);
      updateSearchState();
    };

    // 4. Custom Group By Actions
    const addCustomGroupBy = () => {
      if (!customGroupByField.value) return;
      if (!customGroupBysList.value.includes(customGroupByField.value)) {
        customGroupBysList.value.push(customGroupByField.value);
        updateSearchState();
      }
    };

    const removeCustomGroupBy = (field: string) => {
      customGroupBysList.value = customGroupBysList.value.filter(f => f !== field);
      updateSearchState();
    };

    // 5. Favorites / Saved Searches
    const saveAsFavorite = () => {
      const name = prompt('请输入收藏的搜索名称:');
      if (!name) return;

      const domains: any[] = [];
      const groupByFields: string[] = [];

      // Extract current filter state
      odooFilters.value.forEach((f: any) => {
        if (activeFilters.value[f.attrs.name] && f.attrs.domain) {
          try {
            domains.push(...JSON.parse(f.attrs.domain.replace(/'/g, '"')));
          } catch (e) {}
        }
      });
      customFilters.value.forEach(cf => domains.push([cf.field, cf.op, cf.val]));

      odooGroupBys.value.forEach((f: any) => {
        if (activeGroupBys.value[f.attrs.name]) {
          const field = parseGroupByField(f.attrs.context);
          if (field) groupByFields.push(field);
        }
      });
      customGroupBysList.value.forEach(f => groupByFields.push(f));

      favorites.value.push({ name, domain: domains, groupBy: groupByFields });
      localStorage.setItem(`odoo_favorites_${props.arch?.attrs?.res_model || 'default'}`, JSON.stringify(favorites.value));
    };

    const applyFavorite = (fav: any) => {
      props.onSearchChange({
        domain: fav.domain,
        groupBy: fav.groupBy
      });
    };

    onMounted(() => {
      const saved = localStorage.getItem(`odoo_favorites_${props.arch?.attrs?.res_model || 'default'}`);
      if (saved) {
        favorites.value = JSON.parse(saved);
      }
    });

    const toggleFilter = (name: string) => {
      activeFilters.value[name] = !activeFilters.value[name];
      updateSearchState();
    };

    const toggleGroupBy = (name: string) => {
      activeGroupBys.value[name] = !activeGroupBys.value[name];
      updateSearchState();
    };

    return () => {
      return h('div', {
        class: 'o_odoo_control_panel',
        style: 'background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;'
      }, [
        // Faceted Search bar & Main actions
        h('div', { style: 'display: flex; gap: 12px; align-items: center;' }, [
          h('div', { style: 'flex-grow: 1; position: relative; display: flex; align-items: center;' }, [
            // Facet Tags for active filters shown inside the search box!
            h('div', {
              style: 'position: absolute; left: 12px; display: flex; gap: 6px; flex-wrap: wrap; max-width: 60%; z-index: 5;'
            }, [
              // Custom filter tags shown as tags
              customFilters.value.map((cf, idx) => h('el-tag', {
                key: idx,
                closable: true,
                size: 'small',
                type: 'info',
                onClose: () => removeCustomFilter(idx),
                style: '--el-tag-bg-color: #f1f5f9; --el-tag-border-color: #cbd5e1; --el-tag-text-color: #475569;'
              }, cf.label)),
              
              // Custom Group Bys shown as blue-purple tags
              customGroupBysList.value.map((gb, idx) => h('el-tag', {
                key: idx,
                closable: true,
                size: 'small',
                type: 'success',
                onClose: () => removeCustomGroupBy(gb),
                style: '--el-tag-bg-color: #f3e8ff; --el-tag-border-color: #d8b4fe; --el-tag-text-color: #6b21a8;'
              }, `分组: ${gb}`))
            ]),

            // Smart Input field with dynamic offset based on tag list width
            h('el-input', {
              placeholder: customFilters.value.length > 0 || customGroupBysList.value.length > 0 ? '' : '🔍 搜索...',
              value: searchQuery.value,
              'onUpdate:modelValue': (val: string) => {
                searchQuery.value = val;
                updateSearchState();
              },
              style: `width: 100%;`
            }, {
              // Prepend dropdown to allow picking which fields to search on!
              prepend: () => h('el-select', {
                placeholder: '搜素字段',
                modelValue: selectedFields.value,
                'onUpdate:modelValue': (val: string[]) => {
                  selectedFields.value = val;
                  updateSearchState();
                },
                multiple: true,
                collapseTags: true,
                style: 'width: 120px;'
              }, searchFields.value.map((f: any) => h('el-option', {
                key: f.attrs.name,
                label: f.attrs.string || f.attrs.name.toUpperCase(),
                value: f.attrs.name
              })))
            })
          ]),

          // Search Dropdown Menus: Filters, Group By, Favorites
          h('el-dropdown', { trigger: 'click' }, {
            default: () => h('el-button', { type: 'primary', style: 'background: #714B67; border-color: #714B67;' }, '筛选器 🔽'),
            dropdown: () => h('el-dropdown-menu', null, [
              // Predefined Odoo Filters
              odooFilters.value.map((f: any) => h('el-dropdown-item', {
                key: f.attrs.name,
                onClick: () => toggleFilter(f.attrs.name)
              }, () => [
                h('span', { style: `color: ${activeFilters.value[f.attrs.name] ? '#714B67' : 'inherit'}; font-weight: ${activeFilters.value[f.attrs.name] ? '600' : 'normal'}` }, f.attrs.string)
              ])),
              h('el-dropdown-item', { divided: true, onClick: () => { showCustomFilterDialog.value = true; } }, '➕ 添加自定义筛选')
            ])
          }),

          h('el-dropdown', { trigger: 'click' }, {
            default: () => h('el-button', null, '分组 🔽'),
            dropdown: () => h('el-dropdown-menu', null, [
              // Predefined Odoo Group Bys
              odooGroupBys.value.map((f: any) => h('el-dropdown-item', {
                key: f.attrs.name,
                onClick: () => toggleGroupBy(f.attrs.name)
              }, () => [
                h('span', { style: `color: ${activeGroupBys.value[f.attrs.name] ? '#6b21a8' : 'inherit'}; font-weight: ${activeGroupBys.value[f.attrs.name] ? '600' : 'normal'}` }, f.attrs.string)
              ])),
              h('el-dropdown-item', { divided: true }, () => h('div', { style: 'padding: 4px; display: flex; gap: 8px; align-items: center;' }, [
                h('el-select', {
                  placeholder: '选择字段分组',
                  modelValue: customGroupByField.value,
                  'onUpdate:modelValue': (val: string) => { customGroupByField.value = val; },
                  size: 'small',
                  style: 'width: 130px;'
                }, searchFields.value.map((f: any) => h('el-option', {
                  key: f.attrs.name,
                  label: f.attrs.string || f.attrs.name.toUpperCase(),
                  value: f.attrs.name
                }))),
                h('el-button', { type: 'primary', size: 'small', onClick: addCustomGroupBy }, '添加')
              ]))
            ])
          }),

          h('el-dropdown', { trigger: 'click' }, {
            default: () => h('el-button', null, '收藏 🔽'),
            dropdown: () => h('el-dropdown-menu', null, [
              favorites.value.length === 0 ? h('el-dropdown-item', { disabled: true }, '无保存的收藏') : null,
              favorites.value.map((fav, idx) => h('el-dropdown-item', {
                key: idx,
                onClick: () => applyFavorite(fav)
              }, fav.name)),
              h('el-dropdown-item', { divided: true, onClick: saveAsFavorite }, '⭐ 保存当前搜索')
            ])
          })
        ]),

        // Embedded Custom Filter Form Builder (collapsible dialog look)
        showCustomFilterDialog.value ? h('div', {
          style: 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; display: flex; gap: 12px; align-items: center; justify-content: flex-start; margin-top: 4px;'
        }, [
          h('span', { style: 'font-size: 13px; font-weight: 500; color: #475569;' }, '自定义条件:'),
          h('el-select', {
            placeholder: '选择字段',
            modelValue: customFilterField.value,
            'onUpdate:modelValue': (val: string) => { customFilterField.value = val; },
            size: 'small',
            style: 'width: 140px;'
          }, searchFields.value.map((f: any) => h('el-option', {
            key: f.attrs.name,
            label: f.attrs.string || f.attrs.name.toUpperCase(),
            value: f.attrs.name
          }))),
          h('el-select', {
            modelValue: customFilterOperator.value,
            'onUpdate:modelValue': (val: string) => { customFilterOperator.value = val; },
            size: 'small',
            style: 'width: 90px;'
          }, [
            h('el-option', { label: '等于 (=)', value: '=' }),
            h('el-option', { label: '不等于 (!=)', value: '!=' }),
            h('el-option', { label: '包含 (like)', value: 'like' }),
            h('el-option', { label: '不包含 (not like)', value: 'not like' })
          ]),
          h('el-input', {
            placeholder: '输入值',
            modelValue: customFilterValue.value,
            'onUpdate:modelValue': (val: string) => { customFilterValue.value = val; },
            size: 'small',
            style: 'width: 140px;'
          }),
          h('el-button', { type: 'primary', size: 'small', onClick: addCustomFilter, style: 'background: #714B67; border-color: #714B67;' }, '确定'),
          h('el-button', { size: 'small', onClick: () => { showCustomFilterDialog.value = false; } }, '取消')
        ]) : null
      ]);
    };
  }
});