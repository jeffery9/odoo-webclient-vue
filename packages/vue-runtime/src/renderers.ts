import { defineComponent, h } from 'vue';
import { Modifier } from '@odoo/sdk';
import { componentRegistry } from './registry.js';

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

        // Compile and evaluate standard Odoo modifiers
        const spec = {
          attrs: node.attrs?.attrs,
          readonly: node.attrs?.readonly,
          invisible: node.attrs?.invisible,
          required: node.attrs?.required,
          states: node.attrs?.states
        };
        const compiled = Modifier.compile(spec);
        const evaluated = Modifier.evaluate(compiled, props.record as any, {});

        // 1. If invisible, omit rendering completely
        if (evaluated.invisible) {
          return null;
        }

        // 2. Parse options from python dict syntax to JSON object
        let optionsObj: any = {};
        if (node.attrs?.options) {
          try {
            const cleaned = node.attrs.options
              .replace(/'/g, '"')
              .replace(/\bTrue\b/g, 'true')
              .replace(/\bFalse\b/g, 'false');
            optionsObj = JSON.parse(cleaned);
          } catch (e) {
            // fallback
          }
        }

        // 3. Resolve actual widget from componentRegistry
        const widgetName = node.attrs?.widget || 'char';
        const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');

        return h(widgetComp, {
          record: props.record,
          name,
          readonly: evaluated.readonly,
          required: evaluated.required,
          options: optionsObj,
          class: evaluated.required ? 'o_required_modifier' : ''
        });
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
