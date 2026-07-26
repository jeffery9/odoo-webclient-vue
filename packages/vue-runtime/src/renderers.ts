import { defineComponent, h } from 'vue';

export const ListRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props) {
    return () => {
      const archFields = (props.arch?.children || []).filter((child: any) => child.tag === 'field');

      const thVNodes = archFields.map((f: any) => h('th', f.attrs?.string || f.attrs?.name || ''));
      const trHeader = h('tr', null, thVNodes);
      const thead = h('thead', null, trHeader);

      const rowVNodes = (props.records || []).map((rec: any) => {
        const tdVNodes = archFields.map((f: any) => h('td', rec.get(f.attrs.name)));
        return h('tr', null, tdVNodes);
      });
      const tbody = h('tbody', null, rowVNodes);

      return h('table', null, [thead, tbody]);
    };
  }
});

export const FormRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    record: { type: Object, required: true }
  },
  setup(props) {
    const renderNode = (node: any): any => {
      if (!node) return null;

      if (node.tag === 'sheet') {
        const children = (node.children || []).map(renderNode).filter(Boolean);
        return h('div', { class: 'o_form_sheet' }, children);
      }

      if (node.tag === 'field') {
        const name = node.attrs?.name;
        const val = props.record?.get(name);
        return h('span', { class: 'o_field_widget' }, val !== undefined ? String(val) : '');
      }

      if (node.children) {
        const children = node.children.map(renderNode).filter(Boolean);
        return h('div', null, children);
      }

      return null;
    };

    return () => {
      const rootChildren = (props.arch?.children || []).map(renderNode).filter(Boolean);
      return h('div', { class: 'o_form_view' }, rootChildren);
    };
  }
});
