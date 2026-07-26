import { h, ref } from 'vue';

export const SearchPanel = {
  name: 'SearchPanel',
  props: {
    arch: { type: Object, required: true },
    onFilterChange: { type: Function, required: true }
  },
  setup(props: any) {
    // Selected option ID for each search panel field (e.g. selections.value['category_id'] = 2)
    const selections = ref<Record<string, any>>({});
    
    // Loaded lists of options for fields (highly extensible domain models)
    const fieldOptions = ref<Record<string, { id: any; name: string }[]>>({
      category_id: [
        { id: 1, name: 'VIP Clients' },
        { id: 2, name: 'Standard Partners' },
        { id: 3, name: 'External Vendors' }
      ],
      user_id: [
        { id: 1, name: 'Administrator' },
        { id: 2, name: 'Demo User' }
      ]
    });

    // Helper to extract <field> elements inside the <searchpanel> child of <search>
    const getSearchFields = () => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      const panel = props.arch.children?.find((c: any) => c.tag === 'searchpanel');
      if (!panel) return [];
      return panel.children?.filter((c: any) => c.tag === 'field') || [];
    };

    const handleSelect = (fieldName: string, optionId: any) => {
      if (optionId === undefined) {
        delete selections.value[fieldName];
      } else {
        selections.value[fieldName] = optionId;
      }
      
      // Map selections to Odoo-style domain conditions (e.g. ['category_id', '=', optionId])
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
          const options = fieldOptions.value[name] || [
            { id: 1, name: 'General Option A' },
            { id: 2, name: 'General Option B' }
          ];

          return h('div', { class: 'o_search_panel_section', key: name }, [
            h('div', { class: 'o_search_panel_section_header' }, label),
            h('ul', { class: 'o_search_panel_list' }, [
              // "All" option to reset filtering on this field
              h('li', {
                class: ['o_search_panel_item', selections.value[name] === undefined ? 'active' : ''],
                onClick: () => handleSelect(name, undefined)
              }, [
                h('span', { class: 'o_search_panel_icon' }, '📁'),
                h('span', null, 'All')
              ]),
              // Dynamic item option list
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
