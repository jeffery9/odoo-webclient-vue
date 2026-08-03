import { defineComponent, h, inject } from 'vue';
import { Modifier } from '@odoo/sdk';
import { componentRegistry } from '../registry.js';
import { ACTION_MANAGER_KEY } from '../di.js';
import { OdooNotebook } from './OdooNotebook.js';
import { resolveFieldWidget } from './index.js';

export const FormRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    record: { type: Object, required: true },
    fields: { type: Object, default: () => ({}) },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY) as any;

    const renderNode = (node: any, isGrid = false): any => {
      if (!node) return null;

      if (node.tag === 'header') {
        const children = node.children || [];
        const buttonChildren = children.filter((c: any) => c.tag === 'button' || (c.tag === 'field' && c.attrs?.widget !== 'statusbar' && c.attrs?.name !== 'state'));
        const statusbarChildren = children.filter((c: any) => c.tag === 'field' && (c.attrs?.widget === 'statusbar' || c.attrs?.name === 'state'));

        const btnNodes = buttonChildren.map((c: any) => renderNode(c)).flat().filter(Boolean);
        const statusNodes = statusbarChildren.map((c: any) => {
          const name = c.attrs?.name;
          const spec = {
            attrs: c.attrs?.attrs,
            readonly: c.attrs?.readonly,
            invisible: c.attrs?.invisible,
            required: c.attrs?.required,
            states: c.attrs?.states
          };
          const compiled = Modifier.compile(spec);
          const evaluated = Modifier.evaluate(compiled, props.record as any, {});
          if (evaluated.invisible) return null;

          const widgetComp = componentRegistry.get('statusbar');
          return h(widgetComp, {
            record: props.record,
            name,
            readonly: props.readonly || evaluated.readonly,
            statusbar_visible: c.attrs?.statusbar_visible || '',
            selection: props.fields?.[name]?.selection || []
          });
        }).flat().filter(Boolean);

        return h('div', {
          class: 'o_form_statusbar',
          style: 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dee2e6; background-color: #f8f9fa; padding: 6px 16px; min-height: 40px; width: 100%; box-sizing: border-box; flex-wrap: wrap; gap: 12px;'
        }, [
          h('div', { class: 'o_statusbar_buttons', style: 'display: flex; gap: 8px;' }, btnNodes),
          h('div', { class: 'o_statusbar_status', style: 'display: flex; align-items: center; gap: 4px;' }, statusNodes)
        ]);
      }

      if (node.tag === 'button') {
        const stringVal = node.attrs?.string || node.attrs?.name || 'Button';
        const type = node.attrs?.type || 'object';
        const isPrimary = node.attrs?.class?.includes('oe_highlight') || node.attrs?.class?.includes('btn-primary');

        return h('button', {
          class: isPrimary ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm',
          style: isPrimary 
            ? 'background: #714B67; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity 0.15s;'
            : 'background: white; color: #475569; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.15s;',
          onClick: () => {
            const name = node.attrs?.name;
            if (actionManager) {
              actionManager.doAction({
                name: `Execute Button ${name}`,
                type: 'ir.actions.client',
                tag: 'execute_button',
                params: { button_name: name, button_type: type }
              });
            } else {
              alert(`Executing: ${name} (${type})`);
            }
          }
        }, stringVal);
      }

      if (node.tag === 'sheet') {
        const children = (node.children || []).map((c: any) => renderNode(c)).flat().filter(Boolean);
        return h('div', { class: 'o_form_sheet_bg', style: 'padding: 16px; background-color: #f8fafc; border-radius: 8px; width: 100%; box-sizing: border-box;' }, [
          h('div', { class: 'o_form_sheet', style: 'background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 24px; min-height: 400px; width: 100%; box-sizing: border-box;' }, children)
        ]);
      }

      if (node.tag === 'group') {
        const isOuter = node.children?.some((c: any) => c.tag === 'group');
        const children = (node.children || []).map((c: any) => renderNode(c, !isOuter)).flat().filter(Boolean);
        return h('div', {
          class: isOuter ? 'o_group' : 'o_inner_group',
          style: isOuter ? 'display: flex; gap: 24px; width: 100%; flex-wrap: wrap;' : 'display: grid; grid-template-columns: minmax(120px, auto) 1fr; gap: 8px 16px; align-items: center; width: 100%; margin-bottom: 16px;'
        }, children);
      }

      if (node.tag === 'notebook') {
        return h(OdooNotebook, { node, renderNode });
      }

      if (node.tag === 'page') {
        const children = (node.children || []).map((c: any) => renderNode(c)).flat().filter(Boolean);
        return h('div', { class: 'o_notebook_page', style: 'width: 100%;' }, children);
      }

      if (node.tag === 'div' && node.attrs?.class === 'oe_title') {
        const children = (node.children || []).map((c: any) => renderNode(c)).flat().filter(Boolean);
        return h('div', { class: 'oe_title' }, children);
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
        const widgetName = resolveFieldWidget(name, props.record, node.attrs, 'form');
        const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');

        const fieldVnode = h(widgetComp, {
          record: props.record,
          name,
          readonly: props.readonly || evaluated.readonly,
          required: evaluated.required,
          options: optionsObj,
          relation: node.attrs?.relation,
          selection: props.fields?.[name]?.selection || [],
          subViews: node.children || [],
          class: evaluated.required ? 'o_required_modifier' : ''
        });

        if (isGrid && !node.attrs?.nolabel && node.attrs?.nolabel !== '1') {
          const labelString = node.attrs?.string || props.fields?.[name]?.string || name;
          const labelVnode = h('label', { class: 'o_form_label', style: 'font-weight: 600; color: #475569; font-size: 13px;' }, labelString);
          return [labelVnode, fieldVnode];
        }

        return fieldVnode;
      }

      if (node.tag === 'div') {
        const children = (node.children || []).map((c: any) => renderNode(c)).flat().filter(Boolean);
        const cls = node.attrs?.class || '';
        return h('div', { class: cls }, children);
      }

      if (node.children) {
        const children = node.children.map((c: any) => renderNode(c)).flat().filter(Boolean);
        return h('div', null, children);
      }

      return null;
    };

    return () => {
      const rootChildren = (props.arch?.children || []).map((c: any) => renderNode(c)).flat().filter(Boolean);
      return h('div', { class: 'o_form_view', style: 'display: flex; flex-direction: column; width: 100%; box-sizing: border-box; overflow-y: auto; height: 100%;' }, rootChildren);
    };
  }
});
