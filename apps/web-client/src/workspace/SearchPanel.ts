import { h, ref, watch, onMounted } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';

const FIELD_RELATIONS: Record<string, string> = {
  category_id: 'res.partner.category',
  user_id: 'res.users',
  company_id: 'res.company'
};

export const SearchPanel = {
  name: 'SearchPanel',
  props: {
    arch: { type: Object, required: true },
    onFilterChange: { type: Function, required: true }
  },
  setup(props: any) {
    const selections = ref<Record<string, any>>({});
    const fieldOptions = ref<Record<string, { id: any; name: string }[]>>({});

    // Extract searchpanel field definition nodes
    const getSearchFields = () => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      const panel = props.arch.children?.find((c: any) => c.tag === 'searchpanel');
      if (!panel) return [];
      return panel.children?.filter((c: any) => c.tag === 'field') || [];
    };

    // Load choices dynamically from Odoo relational models using search_read
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

    // Reactively reload on initialization and on arch changes
    onMounted(loadFieldOptions);
    watch(() => props.arch, loadFieldOptions, { deep: true });

    const handleSelect = (fieldName: string, optionId: any) => {
      if (optionId === undefined) {
        delete selections.value[fieldName];
      } else {
        selections.value[fieldName] = optionId;
      }
      
      const domains: any[] = [];
      for (const [key, val] of Object.entries(selections.value)) {
        domains.push([key, '=', val]);
      }
      
      props.onFilterChange(domains);
    };

    return () => {
      const fields = getSearchFields();
      if (fields.length === 0) return null;

      return h('aside', { class: 'o_search_panel' }, [
        h('div', { class: 'o_search_panel_title' }, '🔍 Search Panel'),
        fields.map((f: any) => {
          const name = f.attrs.name;
          const label = f.attrs.string || name.replace('_id', '').toUpperCase();
          const options = fieldOptions.value[name] || [];

          return h('div', { class: 'o_search_panel_section', key: name }, [
            h('div', { class: 'o_search_panel_section_header' }, label),
            h('ul', { class: 'o_search_panel_list' }, [
              h('li', {
                class: ['o_search_panel_item', selections.value[name] === undefined ? 'active' : ''],
                onClick: () => handleSelect(name, undefined)
              }, [
                h('span', { class: 'o_search_panel_icon' }, '📁'),
                h('span', null, 'All')
              ]),
              options.map((opt: any) => h('li', {
                key: opt.id,
                class: ['o_search_panel_item', selections.value[name] === opt.id ? 'active' : ''],
                onClick: () => handleSelect(name, opt.id)
              }, [
                h('span', { class: 'o_search_panel_icon' }, '🗂️'),
                h('span', null, opt.name)
              ]))
            ])
          ]);
        })
      ]);
    };
  }
};
