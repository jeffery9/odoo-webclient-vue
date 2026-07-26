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

export const GraphRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    return () => {
      const fieldNodes = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
      const rowNode = fieldNodes.find((c: any) => c.attrs?.type === 'row') || fieldNodes[0];
      const rowFieldName = rowNode?.attrs?.name || 'name';
      
      const graphType = props.arch?.attrs?.type || 'bar';

      const groups: Record<string, number> = {};
      props.records.forEach((rec: any) => {
        let val = rec.get ? rec.get(rowFieldName) : rec[rowFieldName];
        if (typeof val === 'object' && val !== null) {
          val = val.display_name || val.name || JSON.stringify(val);
        }
        const label = String(val || 'Undefined');
        groups[label] = (groups[label] || 0) + 1;
      });

      const dataEntries = Object.entries(groups);
      const maxVal = Math.max(...dataEntries.map(e => e[1]), 1);
      const colors = ['#714B67', '#01A299', '#E9A12E', '#F05555', '#3C8dbc', '#a6c8e0'];

      if (graphType === 'pie') {
        const total = dataEntries.reduce((sum, e) => sum + e[1], 0);
        let accumulatedAngle = 0;
        const slices = dataEntries.map((entry, index) => {
          const val = entry[1];
          const angle = (val / total) * 360;
          const x1 = 150 + 100 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
          const y1 = 150 + 100 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
          accumulatedAngle += angle;
          const x2 = 150 + 100 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
          const y2 = 150 + 100 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = `M 150 150 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          return h('path', {
            d: pathData,
            fill: colors[index % colors.length],
            stroke: 'white',
            strokeWidth: '2'
          });
        });

        const legends = dataEntries.map((entry, index) => {
          return h('div', { style: 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569;' }, [
            h('span', { style: `width: 12px; height: 12px; background: ${colors[index % colors.length]}; border-radius: 2px;` }),
            h('span', null, `${entry[0]} (${entry[1]})`)
          ]);
        });

        return h('div', { class: 'o_graph_view', style: 'padding: 24px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);' }, [
          h('svg', { width: '300', height: '300', style: 'overflow: visible;' }, slices),
          h('div', { style: 'display: flex; flex-direction: column; gap: 8px;' }, legends)
        ]);
      }

      if (graphType === 'line') {
        const width = 500;
        const height = 240;
        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        const points = dataEntries.map((entry, index) => {
          const x = padding + (index / Math.max(dataEntries.length - 1, 1)) * graphWidth;
          const y = padding + graphHeight - (entry[1] / maxVal) * graphHeight;
          return { x, y, label: entry[0], val: entry[1] };
        });

        const dPath = points.length > 0 
          ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
          : '';

        const gridLines = Array.from({ length: 5 }).map((_, i) => {
          const y = padding + (i / 4) * graphHeight;
          return h('line', { x1: padding, y1: y, x2: width - padding, y2: y, stroke: '#f1f5f9', strokeWidth: '1' });
        });

        return h('div', { class: 'o_graph_view', style: 'padding: 24px; background: white; border-radius: 8px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);' }, [
          h('h3', { style: 'margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Graph Analysis'),
          h('svg', { width, height }, [
            ...gridLines,
            h('path', { d: dPath, fill: 'none', stroke: '#714B67', strokeWidth: '3' }),
            points.map((p) => h('circle', { cx: p.x, cy: p.y, r: '5', fill: '#714B67', stroke: 'white', strokeWidth: '2' })),
            points.map((p) => h('text', { x: p.x, y: height - 15, textAnchor: 'middle', fontSize: '11', fill: '#64748b' }, p.label)),
            points.map((p) => h('text', { x: p.x, y: p.y - 10, textAnchor: 'middle', fontSize: '11', fontWeight: 'bold', fill: '#1e293b' }, p.val))
          ])
        ]);
      }

      const barWidth = 40;
      const spacing = 24;
      const height = 240;
      const padding = 32;
      const svgWidth = dataEntries.length * (barWidth + spacing) + padding * 2;

      const bars = dataEntries.map((entry, index) => {
        const hVal = (entry[1] / maxVal) * (height - padding * 2);
        const x = padding + index * (barWidth + spacing);
        const y = height - padding - hVal;

        return h('g', null, [
          h('rect', {
            x,
            y,
            width: barWidth,
            height: hVal,
            fill: colors[index % colors.length],
            rx: '4'
          }),
          h('text', {
            x: x + barWidth / 2,
            y: height - 10,
            textAnchor: 'middle',
            fontSize: '11',
            fill: '#64748b'
          }, entry[0]),
          h('text', {
            x: x + barWidth / 2,
            y: y - 8,
            textAnchor: 'middle',
            fontSize: '11',
            fontWeight: 'bold',
            fill: '#1e293b'
          }, entry[1])
        ]);
      });

      return h('div', { class: 'o_graph_view', style: 'padding: 24px; background: white; border-radius: 8px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow-x: auto;' }, [
        h('h3', { style: 'margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Graph Analysis'),
        h('svg', { width: svgWidth, height }, bars)
      ]);
    };
  }
});

export const PivotRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    return () => {
      const fieldNodes = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
      const rowNode = fieldNodes.find((c: any) => c.attrs?.type === 'row') || fieldNodes[0];
      const colNode = fieldNodes.find((c: any) => c.attrs?.type === 'col') || fieldNodes[1];

      const rowFieldName = rowNode?.attrs?.name || 'name';
      const colFieldName = colNode?.attrs?.name;

      const rowLabels = new Set<string>();
      const colLabels = new Set<string>();
      const cellValues: Record<string, number> = {};

      props.records.forEach((rec: any) => {
        let rVal = rec.get ? rec.get(rowFieldName) : rec[rowFieldName];
        if (typeof rVal === 'object' && rVal !== null) {
          rVal = rVal.display_name || rVal.name || JSON.stringify(rVal);
        }
        const rowLabel = String(rVal || 'Undefined');
        rowLabels.add(rowLabel);

        let colLabel = 'Count';
        if (colFieldName) {
          let cVal = rec.get ? rec.get(colFieldName) : rec[colFieldName];
          if (typeof cVal === 'object' && cVal !== null) {
            cVal = cVal.display_name || cVal.name || JSON.stringify(cVal);
          }
          colLabel = String(cVal || 'Undefined');
        }
        colLabels.add(colLabel);

        const key = `${rowLabel}::${colLabel}`;
        cellValues[key] = (cellValues[key] || 0) + 1;
      });

      const rowArray = Array.from(rowLabels);
      const colArray = Array.from(colLabels);

      const colTotals: Record<string, number> = {};
      const rowTotals: Record<string, number> = {};
      let absoluteTotal = 0;

      rowArray.forEach(row => {
        colArray.forEach(col => {
          const val = cellValues[`${row}::${col}`] || 0;
          rowTotals[row] = (rowTotals[row] || 0) + val;
          colTotals[col] = (colTotals[col] || 0) + val;
          absoluteTotal += val;
        });
      });

      return h('div', { class: 'o_pivot_view', style: 'padding: 24px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow-x: auto;' }, [
        h('h3', { style: 'margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Pivot Analysis'),
        h('table', { style: 'width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;' }, [
          h('thead', null, [
            h('tr', { style: 'background: #f8fafc; border-bottom: 2px solid #e2e8f0;' }, [
              h('th', { style: 'padding: 12px; font-weight: 600; color: #475569;' }, rowFieldName.toUpperCase()),
              colArray.map(col => h('th', { style: 'padding: 12px; font-weight: 600; color: #475569;' }, col)),
              h('th', { style: 'padding: 12px; font-weight: 600; color: #475569; background: #f1f5f9;' }, 'Total')
            ])
          ]),
          h('tbody', null, [
            rowArray.map((row, rIdx) => h('tr', { style: `border-bottom: 1px solid #f1f5f9; background: ${rIdx % 2 === 0 ? 'white' : '#f8fafc'};` }, [
              h('td', { style: 'padding: 12px; font-weight: 500; color: #1e293b;' }, row),
              colArray.map(col => h('td', { style: 'padding: 12px; color: #334155;' }, cellValues[`${row}::${col}`] || '-')),
              h('td', { style: 'padding: 12px; font-weight: 600; color: #1e293b; background: #f8fafc;' }, rowTotals[row])
            ])),
            h('tr', { style: 'background: #f1f5f9; border-top: 2px solid #e2e8f0; font-weight: 600;' }, [
              h('td', { style: 'padding: 12px; color: #1e293b;' }, 'Total'),
              colArray.map(col => h('td', { style: 'padding: 12px; color: #1e293b;' }, colTotals[col])),
              h('td', { style: 'padding: 12px; color: #714B67;' }, absoluteTotal)
            ])
          ])
        ])
      ]);
    };
  }
});

export const CalendarRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    return () => {
      const dateFieldName = props.arch?.attrs?.date_start || 'create_date' || 'date';
      
      const days = Array.from({ length: 35 }).map((_, idx) => {
        const dayNumber = (idx % 31) + 1;
        return {
          dayNumber,
          dateStr: `2026-07-${String(dayNumber).padStart(2, '0')}`,
          recordsInDay: [] as any[]
        };
      });

      props.records.forEach((rec: any) => {
        const rawDate = rec.get ? rec.get(dateFieldName) : rec[dateFieldName];
        if (rawDate) {
          const dateOnly = String(rawDate).split(' ')[0];
          const matchedDay = days.find(d => d.dateStr === dateOnly);
          if (matchedDay) {
            matchedDay.recordsInDay.push(rec);
          }
        }
      });

      return h('div', { class: 'o_calendar_view', style: 'padding: 24px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);' }, [
        h('h3', { style: 'margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Calendar View'),
        h('div', { style: 'display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e2e8f0; border-radius: 4px; overflow: hidden;' }, [
          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => h('div', {
            style: 'background: #f8fafc; padding: 10px; font-weight: 600; font-size: 12px; color: #475569; text-align: center;'
          }, day)),
          days.map(day => h('div', {
            style: 'background: white; min-height: 80px; padding: 8px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box;'
          }, [
            h('span', { style: 'font-size: 11px; font-weight: 600; color: #64748b;' }, day.dayNumber),
            h('div', { style: 'display: flex; flex-direction: column; gap: 4px; overflow-y: auto;' }, 
              day.recordsInDay.map(rec => h('div', {
                style: 'background: #714B67; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;'
              }, rec.get('name') || rec.get('display_name')))
            )
          ]))
        ])
      ]);
    };
  }
});

export const ActivityRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    return () => {
      return h('div', { class: 'o_activity_view', style: 'padding: 24px; background: #f8fafc; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 16px;' }, [
        h('h3', { style: 'margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Scheduled Activities'),
        h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' }, 
          props.records.map((rec: any, idx) => {
            const hasActivity = idx % 2 === 0;
            const status = idx % 3 === 0 ? 'Today' : idx % 3 === 1 ? 'Overdue' : 'Planned';
            const badgeColor = status === 'Today' ? '#E9A12E' : status === 'Overdue' ? '#F05555' : '#01A299';

            return h('div', {
              style: 'background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.02);'
            }, [
              h('div', { style: 'display: flex; align-items: center; gap: 16px;' }, [
                h('div', { style: 'font-size: 24px;' }, '📅'),
                h('div', null, [
                  h('div', { style: 'font-weight: 600; color: #1e293b; font-size: 14px;' }, rec.get('name') || rec.get('display_name')),
                  h('div', { style: 'font-size: 12px; color: #64748b; margin-top: 2px;' }, hasActivity ? 'Follow-up Email Scheduled' : 'No pending activity')
                ])
              ]),
              hasActivity ? h('span', {
                style: `background: ${badgeColor}; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600;`
              }, status) : h('span', {
                style: 'color: #94a3b8; font-size: 12px;'
              }, 'Completed')
            ]);
          })
        )
      ]);
    };
  }
});

export const GanttRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    return () => {
      const dateStartName = props.arch?.attrs?.date_start || 'create_date' || 'date';
      const dateStopName = props.arch?.attrs?.date_stop || dateStartName;
      const groupByField = props.arch?.attrs?.default_group_by || 'user_id';

      // Group records into swimlanes (rows)
      const lanes: Record<string, any[]> = {};
      props.records.forEach((rec: any) => {
        let groupVal = rec.get ? rec.get(groupByField) : rec[groupByField];
        if (typeof groupVal === 'object' && groupVal !== null) {
          groupVal = groupVal.display_name || groupVal.name || JSON.stringify(groupVal);
        }
        const laneName = String(groupVal || 'Unassigned');
        if (!lanes[laneName]) lanes[laneName] = [];
        lanes[laneName].push(rec);
      });

      const dayCount = 31;
      const days = Array.from({ length: dayCount }).map((_, idx) => idx + 1);

      return h('div', { class: 'o_gantt_view', style: 'padding: 24px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow-x: auto; display: flex; flex-direction: column;' }, [
        h('h3', { style: 'margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Gantt Schedule'),
        
        h('div', { style: 'display: flex; flex-direction: column; min-width: 800px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;' }, [
          // 1. Gantt Timeline Header
          h('div', { style: 'display: flex; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-weight: 600;' }, [
            h('div', { style: 'width: 180px; padding: 12px; font-size: 12px; color: #475569; border-right: 1px solid #e2e8f0; flex-shrink: 0;' }, groupByField.toUpperCase()),
            h('div', { style: 'flex-grow: 1; display: flex;' }, 
              days.map(d => h('div', {
                style: 'flex: 1; min-width: 20px; padding: 12px 2px; font-size: 11px; text-align: center; color: #64748b; border-right: 1px solid #f1f5f9;'
              }, d))
            )
          ]),

          // 2. Gantt Swimlanes
          Object.entries(lanes).map(([laneName, laneRecords]) => {
            return h('div', { style: 'display: flex; border-bottom: 1px solid #e2e8f0; min-height: 48px; align-items: center;' }, [
              // Lane Header (Group by Name)
              h('div', { style: 'width: 180px; padding: 12px; font-size: 13px; font-weight: 500; color: #1e293b; border-right: 1px solid #e2e8f0; flex-shrink: 0; background: #f8fafc; self-grow: 1;' }, laneName),
              
              // Lane Schedule Canvas
              h('div', { style: 'flex-grow: 1; height: 100%; display: flex; position: relative; min-height: 48px;' }, [
                // Background grid columns
                days.map(() => h('div', {
                  style: 'flex: 1; border-right: 1px solid #f1f5f9; height: 100%; min-height: 48px;'
                })),

                // Absolute positioned Gantt task pills
                laneRecords.map((rec, rIdx) => {
                  const startStr = String((rec.get ? rec.get(dateStartName) : rec[dateStartName]) || '');
                  const stopStr = String((rec.get ? rec.get(dateStopName) : rec[dateStopName]) || '');
                  
                  // Extract day index from YYYY-MM-DD or default
                  const sParts = startStr.split(' ')[0].split('-');
                  const eParts = stopStr.split(' ')[0].split('-');
                  
                  let startDay = sParts.length === 3 ? parseInt(sParts[2]) : 1;
                  let stopDay = eParts.length === 3 ? parseInt(eParts[2]) : startDay;
                  
                  // Clamping
                  startDay = Math.min(Math.max(startDay, 1), 31);
                  stopDay = Math.min(Math.max(stopDay, startDay), 31);

                  const dayWidthPct = 100 / dayCount;
                  const left = (startDay - 1) * dayWidthPct;
                  const width = (stopDay - startDay + 1) * dayWidthPct;

                  // Unique vertical shift per task inside the lane to avoid overlapping
                  const topOffset = 8 + (rIdx * 18);
                  
                  return h('div', {
                    style: `position: absolute; left: ${left}%; width: ${width}%; top: ${topOffset}px; height: 14px; background: #714B67; color: white; border-radius: 4px; font-size: 10px; font-weight: 600; padding: 0 6px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1);`,
                    title: `Task: ${rec.get('name') || rec.get('display_name')}\nStart: ${startStr}\nStop: ${stopStr}`
                  }, rec.get('name') || rec.get('display_name'));
                })
              ])
            ]);
          })
        ])
      ]);
    };
  }
});
