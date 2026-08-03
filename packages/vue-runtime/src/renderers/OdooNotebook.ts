import { defineComponent, h, ref } from 'vue';

export const OdooNotebook = defineComponent({
  props: {
    node: { type: Object, required: true },
    renderNode: { type: Function, required: true }
  },
  setup(props) {
    const activeIndex = ref(0);
    return () => {
      const pages = (props.node.children || []).filter((c: any) => c.tag === 'page');
      if (pages.length === 0) return null;

      // Render tab headers
      const headers = pages.map((page: any, index: number) => {
        const isActive = index === activeIndex.value;
        const label = page.attrs?.string || `Tab ${index + 1}`;
        
        return h('li', {
          style: `padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 600; border-bottom: 2px solid ${isActive ? '#714B67' : 'transparent'}; color: ${isActive ? '#714B67' : '#64748b'}; margin-right: 8px; transition: all 0.15s; list-style: none;`,
          class: isActive ? 'active' : '',
          onClick: () => { activeIndex.value = index; }
        }, label);
      });

      const activePage = pages[activeIndex.value];
      // Conditional lazy rendering of page content to optimize relational sub-views
      const activePageContent = activePage ? props.renderNode(activePage) : null;

      return h('div', { class: 'o_notebook', style: 'margin-top: 24px; display: flex; flex-direction: column; width: 100%;' }, [
        h('ul', {
          class: 'o_notebook_headers',
          style: 'display: flex; list-style: none; margin: 0; padding: 0; border-bottom: 1px solid #dee2e6; flex-wrap: wrap;'
        }, headers),
        h('div', {
          class: 'o_notebook_content',
          style: 'padding: 16px 0; width: 100%; box-sizing: border-box;'
        }, activePageContent)
      ]);
    };
  }
});
