import { h, defineComponent } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';
import { SearchPanelRenderer } from '@odoo/vue-runtime';

export const OdooSearchPanel = defineComponent({
  name: 'OdooSearchPanel',
  props: {
    arch: { type: Object, required: true },
    onFilterChange: { type: Function, required: true }
  },
  setup(props) {
    return () => {
      return h(SearchPanelRenderer, {
        arch: props.arch,
        activeClient: activeClient.value,
        activeContext: activeContext.value,
        onFilterChange: props.onFilterChange
      });
    };
  }
});
