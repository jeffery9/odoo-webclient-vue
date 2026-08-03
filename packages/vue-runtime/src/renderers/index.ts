import { componentRegistry, modelFieldRegistry } from '../registry.js';

interface WidgetContract {
  fields: string[];
  views: string[];
}

export const WIDGET_COMPATIBILITY_MAP: Record<string, WidgetContract> = {
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

export * from './FormRenderer.js';
export * from './ListRenderer.js';
export * from './CardRenderer.js';
export * from './QWebRenderer.js';
export * from './OdooNotebook.js';
export * from './complex/GraphRenderer.js';
export * from './complex/PivotRenderer.js';
export * from './complex/CalendarRenderer.js';
export * from './complex/ActivityRenderer.js';
export * from './complex/GanttRenderer.js';
