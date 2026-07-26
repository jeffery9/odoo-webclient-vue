import { defineComponent, h, inject } from 'vue';
import { Modifier } from '@odoo/sdk';
import { componentRegistry, modelFieldRegistry } from './registry.js';
import { ACTION_MANAGER_KEY } from './di.js';

interface WidgetContract {
  fields: string[];
  views: string[];
}

const WIDGET_COMPATIBILITY_MAP: Record<string, WidgetContract> = {
  'boolean': { fields: ['boolean'], views: ['form', 'list', 'kanban'] },
  'integer': { fields: ['integer', 'float', 'monetary'], views: ['form', 'list', 'kanban'] },
  'float': { fields: ['integer', 'float', 'monetary'], views: ['form', 'list', 'kanban'] },
  'monetary': { fields: ['integer', 'float', 'monetary'], views: ['form', 'list', 'kanban'] },
  'progressbar': { fields: ['integer', 'float', 'monetary'], views: ['form', 'list', 'kanban'] },
  'percentage': { fields: ['integer', 'float', 'monetary'], views: ['form', 'list', 'kanban'] },
  'priority': { fields: ['integer', 'selection', 'char'], views: ['form', 'list', 'kanban'] },
  'badge': { fields: ['selection', 'char', 'integer'], views: ['form', 'list', 'kanban'] },
  'tag': { fields: ['many2many', 'one2many'], views: ['form', 'list', 'kanban'] },
  'many2many_tags': { fields: ['many2many', 'one2many'], views: ['form', 'list', 'kanban'] },
  'many2one': { fields: ['many2one'], views: ['form', 'list', 'kanban'] },
  'one2many': { fields: ['one2many', 'many2many'], views: ['form'] },
  'many2many': { fields: ['many2many', 'one2many'], views: ['form'] },
  'date': { fields: ['date', 'datetime'], views: ['form', 'list', 'kanban'] },
  'datetime': { fields: ['datetime', 'date'], views: ['form', 'list', 'kanban'] },
  'image': { fields: ['binary', 'char', 'text'], views: ['form', 'kanban'] },
  'avatar': { fields: ['many2one', 'char', 'integer'], views: ['list', 'kanban'] },
  'url': { fields: ['char', 'text'], views: ['form', 'list', 'kanban'] },
  'email': { fields: ['char', 'text'], views: ['form', 'list', 'kanban'] },
  'phone': { fields: ['char', 'text'], views: ['form', 'list', 'kanban'] },
  'handle': { fields: ['integer'], views: ['list'] },
};

export function getFieldType(fieldName: string, record: any): string {
  const modelName = record?.modelName || '';
  const registryKey = `${modelName}/${fieldName}`;
  if (modelName && modelFieldRegistry.has(registryKey)) {
    return modelFieldRegistry.get(registryKey);
  }
  if (fieldName.endsWith('_ids')) return 'many2many';
  if (fieldName.endsWith('_id')) return 'many2one';
  if (fieldName === 'comment' || fieldName === 'note' || fieldName === 'description') return 'text';
  if (record?.get) {
    const val = record.get(fieldName);
    if (typeof val === 'boolean') return 'boolean';
    if (typeof val === 'number') return Number.isInteger(val) ? 'integer' : 'float';
    if (Array.isArray(val)) return 'one2many';
  }
  return 'char';
}

export function resolveFieldWidget(fieldName: string, record: any, nodeAttrs: any, viewType: string = 'form'): string {
  const fieldType = getFieldType(fieldName, record);

  if (nodeAttrs?.widget) {
    const widget = nodeAttrs.widget;
    const contract = WIDGET_COMPATIBILITY_MAP[widget];
    if (contract) {
      const isFieldCompatible = contract.fields.includes(fieldType);
      const isViewCompatible = contract.views.includes(viewType);
      
      if (!isFieldCompatible || !isViewCompatible) {
        console.warn(
          `[Odoo Compatibility Warning] Widget "${widget}" is incompatible with field "${fieldName}" (type "${fieldType}") in view "${viewType}". Falling back to default widget "${fieldType}".`
        );
        return fieldType;
      }
    }
    return widget;
  }

  if (nodeAttrs?.type) {
    return nodeAttrs.type;
  }

  return fieldType;
}

export const ListRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null);

    return () => {
      const archFields = (props.arch?.children || []).filter((child: any) => child.tag === 'field');
      const editable = props.arch?.attrs?.editable;

      const thVNodes = archFields.map((f: any) => h('th', f.attrs?.string || f.attrs?.name || ''));
      const trHeader = h('tr', null, thVNodes);
      const thead = h('thead', null, trHeader);

      const rowVNodes = (props.records || []).map((rec: any) => {
        const tdVNodes = archFields.map((f: any) => {
          const fieldName = f.attrs.name;
          if (editable) {
            const widgetName = resolveFieldWidget(fieldName, rec, f.attrs, 'list');
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('td', null, h(widgetComp, {
              record: rec,
              name: fieldName,
              readonly: false
            }));
          } else {
            const cellVal = rec?.get ? rec.get(fieldName) : (rec[fieldName] || '');
            return h('td', null, h('span', { class: 'o_cell_value' }, String(cellVal)));
          }
        });

        return h('tr', {
          onClick: () => {
            if (!editable && actionManager) {
              actionManager.doAction({
                name: 'Edit Relation Record',
                res_model: 'sub.model',
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
                target: 'new',
                res_id: rec.id
              });
            }
          }
        }, tdVNodes);
      });
      const tbody = h('tbody', null, rowVNodes);

      return h('table', { class: 'o_list_view o_subview_list' }, [thead, tbody]);
    };
  }
});

export const CardRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null);

    return () => {
      const cardFields = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
      const cards = (props.records || []).map((childRec: any) => {
        const fieldsVNodes = cardFields.map((f: any) => {
          const fieldName = f.attrs.name;
          const widgetName = f.attrs.widget || 'char';
          const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
          return h('div', { class: 'o_card_field', style: 'margin-bottom: 4px;' }, [
            h('strong', { style: 'margin-right: 4px;' }, f.attrs?.string || fieldName),
            h(widgetComp, { record: childRec, name: fieldName, readonly: true })
          ]);
        });

        return h('div', {
          class: 'o_subview_card',
          style: 'border: 1px solid #ddd; padding: 12px; border-radius: 6px; flex: 1 1 200px; cursor: pointer;',
          onClick: () => {
            if (actionManager) {
              actionManager.doAction({
                name: 'Edit Relation Card',
                res_model: 'sub.model',
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
                target: 'new',
                res_id: childRec.id
              });
            }
          }
        }, fieldsVNodes);
      });

      return h('div', { class: 'o_card_grid', style: 'display: flex; flex-wrap: wrap; gap: 12px;' }, cards);
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
        const widgetName = resolveFieldWidget(name, props.record, node.attrs, 'form');
        const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');

        return h(widgetComp, {
          record: props.record,
          name,
          readonly: evaluated.readonly,
          required: evaluated.required,
          options: optionsObj,
          relation: node.attrs?.relation,
          subViews: node.children || [],
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
