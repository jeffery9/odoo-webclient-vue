import { h, defineComponent, ref, watch, onMounted } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';
// Import standard Chinese Pinyin matching library
import PinyinMatch from 'pinyin-match';

const FIELD_RELATIONS: Record<string, string> = {
  category_id: 'res.partner.category',
  user_id: 'res.users',
  company_id: 'res.company'
};

export const PremiumAdvancedSearchBar = defineComponent({
  name: 'PremiumAdvancedSearchBar',
  props: {
    arch: { type: Object, required: true },
    onSearch: { type: Function, required: true }
  },
  setup(props) {
    const isExpanded = ref(false);
    const searchValues = ref<Record<string, string>>({});
    const activeFilters = ref<Record<string, boolean>>({});
    const fieldOptions = ref<Record<string, { id: any; name: string }[]>>({});
    const dropdownSearchQuery = ref<Record<string, string>>({});

    // 1. Extract searchable fields and filters from Odoo <search> view compile
    const getSearchFields = () => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      return props.arch.children?.filter((c: any) => c.tag === 'field') || [];
    };

    const getSearchFilters = () => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      return props.arch.children?.filter((c: any) => c.tag === 'filter') || [];
    };

    // 2. Load relational choices dynamically from Odoo backend using search_read
    const loadFieldOptions = async () => {
      if (!activeClient.value) return;
      const fields = getSearchFields();

      for (const f of fields) {
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
            fieldOptions.value[name] = records.map((r: any) => ({
              id: r.id,
              name: r.name || r.display_name || `ID ${r.id}`
            }));
          } catch (e) {
            fieldOptions.value[name] = [];
          }
        }
      }
    };

    onMounted(loadFieldOptions);
    watch(() => props.arch, loadFieldOptions, { deep: true });

    // 3. Compile precise Odoo query domain from the active inputs and filters
    const handleQuery = () => {
      const domains: any[] = [];

      // Add input-based filters (supports fuzzy text matching)
      getSearchFields().forEach((f: any) => {
        const name = f.attrs.name;
        const val = searchValues.value[name];
        if (val) {
          if (FIELD_RELATIONS[name]) {
            // Relational field: exact matching
            domains.push([name, '=', Number(val)]);
          } else {
            // Text field: fuzzy matching
            domains.push([name, 'like', val]);
          }
        }
      });

      // Add checked filter buttons
      getSearchFilters().forEach((f: any) => {
        const filterName = f.attrs.name;
        if (activeFilters.value[filterName] && f.attrs.domain) {
          // Eval Odoo context domain string (simple domain parse fallback)
          try {
            const cleanDomainStr = f.attrs.domain.replace(/'/g, '"');
            const parsedDomain = JSON.parse(cleanDomainStr);
            if (Array.isArray(parsedDomain)) {
              domains.push(...parsedDomain);
            }
          } catch (e) {
            // Fallback for simple domain evaluations
          }
        }
      });

      props.onSearch(domains);
    };

    const handleReset = () => {
      searchValues.value = {};
      activeFilters.value = {};
      dropdownSearchQuery.value = {};
      props.onSearch([]);
    };

    const toggleFilter = (filterName: string) => {
      activeFilters.value[filterName] = !activeFilters.value[filterName];
      handleQuery();
    };

    return () => {
      const fields = getSearchFields();
      const filters = getSearchFilters();

      if (fields.length === 0 && filters.length === 0) return null;

      // Slice fields based on fold state (first 3 fields for folded state)
      const visibleFields = isExpanded.value ? fields : fields.slice(0, 3);

      return h('div', {
        class: 'o_premium_advanced_search_bar',
        style: 'background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 24px; display: flex; flex-direction: column; gap: 16px;'
      }, [
        // Fields Search Input Grid
        h('div', {
          style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items: flex-end;'
        }, [
          visibleFields.map((f: any) => {
            const name = f.attrs.name;
            const label = f.attrs.string || name.toUpperCase().replace('_ID', '');
            const isRelational = !!FIELD_RELATIONS[name];

            return h('div', { key: name, style: 'display: flex; flex-direction: column; gap: 6px;' }, [
              h('label', { style: 'font-size: 13px; font-weight: 500; color: #475569;' }, label),
              
              isRelational
                ? h('div', { style: 'position: relative;' }, [
                    // Relational Select element with direct search-as-you-type filter
                    h('select', {
                      value: searchValues.value[name] || '',
                      onChange: (e: any) => {
                        searchValues.value[name] = e.target.value;
                      },
                      style: 'width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #1e293b; background: white; outline: none; appearance: none;'
                    }, [
                      h('option', { value: '' }, '--- 请选择 ---'),
                      // Apply Chinese Pinyin Match filtering to the dropdown choices!
                      (fieldOptions.value[name] || [])
                        .filter((opt) => {
                          const query = dropdownSearchQuery.value[name] || '';
                          if (!query) return true;
                          // Use standard Chinese Pinyin matching (matches Pinyin initials and full text)
                          return PinyinMatch.match(opt.name, query);
                        })
                        .map((opt) => h('option', { value: opt.id, key: opt.id }, opt.name))
                    ]),
                    // Inline fast pinyin search input box right next to relational dropdown
                    h('input', {
                      placeholder: '🔍 拼音过滤',
                      value: dropdownSearchQuery.value[name] || '',
                      onInput: (e: any) => {
                        dropdownSearchQuery.value[name] = e.target.value;
                      },
                      style: 'position: absolute; right: 24px; top: 50%; transform: translateY(-50%); width: 75px; border: none; border-bottom: 1px solid #cbd5e1; outline: none; font-size: 11px; padding: 2px; color: #64748b; background: transparent;'
                    })
                  ])
                : h('input', {
                    type: 'text',
                    placeholder: `请输入${label}`,
                    value: searchValues.value[name] || '',
                    onInput: (e: any) => {
                      searchValues.value[name] = e.target.value;
                    },
                    style: 'width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #1e293b; outline: none; box-sizing: border-box;'
                  })
            ]);
          }),

          // Action Button Group placed side-by-side with inputs
          h('div', { style: 'display: flex; gap: 10px; justify-content: flex-end;' }, [
            h('button', {
              onClick: handleQuery,
              style: 'background: #714B67; color: white; border: none; border-radius: 6px; padding: 8px 18px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;'
            }, '🔍 查询'),
            h('button', {
              onClick: handleReset,
              style: 'background: white; border: 1px solid #cbd5e1; color: #475569; border-radius: 6px; padding: 8px 18px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;'
            }, '🔄 重置'),
            fields.length > 3
              ? h('button', {
                  onClick: () => {
                    isExpanded.value = !isExpanded.value;
                  },
                  style: 'background: transparent; border: none; color: #714B67; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 4px;'
                }, isExpanded.value ? '📁 收起筛选' : '📂 展开更多')
              : null
          ])
        ]),

        // Filters Checkbox Row (quick tags bar)
        filters.length > 0
          ? h('div', {
              style: 'border-top: 1px dashed #e2e8f0; padding-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;'
            }, [
              h('span', { style: 'font-size: 12px; font-weight: 500; color: #64748b; margin-right: 4px;' }, '快捷过滤:'),
              filters.map((f: any) => {
                const filterName = f.attrs.name;
                const label = f.attrs.string || filterName;
                const isChecked = !!activeFilters.value[filterName];

                return h('button', {
                  key: filterName,
                  onClick: () => toggleFilter(filterName),
                  style: `
                    background: ${isChecked ? '#714B67' : '#f1f5f9'};
                    color: ${isChecked ? 'white' : '#475569'};
                    border: 1px solid ${isChecked ? '#714B67' : '#e2e8f0'};
                    border-radius: 100px;
                    padding: 4px 14px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                  `
                }, label);
              })
            ])
          : null
      ]);
    };
  }
});