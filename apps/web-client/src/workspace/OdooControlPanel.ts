import { h, defineComponent, ref } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';
import { SearchView } from '@odoo/vue-runtime';

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

    const handleSearchChange = (state: { domain: any[]; groupBy: string[] }) => {
      props.onSearchChange(state);
    };

    return () => {
      return h('div', {
        class: 'o_odoo_control_panel bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-6'
      }, [
        h(SearchView, {
          arch: props.arch,
          fieldValues: fieldValues.value,
          'onUpdate:fieldValues': (val: any) => { fieldValues.value = val; },
          activeFilters: activeFilters.value,
          'onUpdate:activeFilters': (val: any) => { activeFilters.value = val; },
          activeGroupBys: activeGroupBys.value,
          'onUpdate:activeGroupBys': (val: any) => { activeGroupBys.value = val; },
          activeClient: activeClient.value,
          activeContext: activeContext.value,
          onSearchChange: handleSearchChange
        })
      ]);
    };
  }
});
