import { defineComponent, h, inject, ref, computed } from 'vue';
import { componentRegistry } from '../registry.js';
import { ACTION_MANAGER_KEY } from '../di.js';
import { resolveFieldWidget } from './index.js';
import { Expression } from '@odoo/sdk';

export const ListRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null) as any;
    const activeRowId = ref<number | null>(null);

    // Parse and compile decoration expressions in advance
    const decorations = computed(() => {
      const attrs = props.arch?.attrs || {};
      const list: { class: string; ast: any }[] = [];

      for (const [key, value] of Object.entries(attrs)) {
        if (key.startsWith('decoration-') && typeof value === 'string') {
          const dec = key.slice('decoration-'.length);
          let className = '';
          switch (dec) {
            case 'danger': className = 'text-red-600 font-medium'; break;
            case 'success': className = 'text-green-600 font-medium'; break;
            case 'warning': className = 'text-amber-600 font-medium'; break;
            case 'info': className = 'text-blue-600 font-medium'; break;
            case 'muted': className = 'text-slate-400 italic'; break;
            case 'bf': className = 'font-bold'; break;
            case 'it': className = 'italic'; break;
            default: className = `o_decoration_${dec}`;
          }

          try {
            const ast = Expression.parse(value);
            list.push({ class: className, ast });
          } catch (e) {
            console.warn(`Failed to parse list decoration: ${key}="${value}"`, e);
          }
        }
      }
      return list;
    });

    const getRecordEnv = (rec: any) => {
      return new Proxy({}, {
        get: (_, prop: string) => {
          if (typeof prop === 'string') {
            return rec?.get ? rec.get(prop) : rec?.[prop];
          }
          return undefined;
        }
      });
    };

    const getRowClasses = (rec: any) => {
      const classes: string[] = [];
      const env = getRecordEnv(rec);

      for (const item of decorations.value) {
        try {
          const matched = Expression.evaluate(item.ast, env);
          if (matched) {
            classes.push(item.class);
          }
        } catch (e) {
          // ignore
        }
      }
      return classes.join(' ');
    };

    return () => {
      const archFields = (props.arch?.children || []).filter((child: any) => child.tag === 'field');
      const editable = props.arch?.attrs?.editable;

      const thVNodes = archFields.map((f: any) => h('th', { class: 'p-3 text-left font-semibold text-slate-700 border-b border-slate-200' }, f.attrs?.string || f.attrs?.name || ''));
      const trHeader = h('tr', { class: 'bg-slate-50' }, thVNodes);
      const thead = h('thead', null, trHeader);

      const rowVNodes = (props.records || []).map((rec: any) => {
        const isRowActive = editable && activeRowId.value === rec.id;

        const tdVNodes = archFields.map((f: any) => {
          const fieldName = f.attrs.name;

          if (editable) {
            const widgetName = resolveFieldWidget(fieldName, rec, f.attrs, 'list');
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('td', { class: 'p-3 border-b border-slate-100' }, h(widgetComp, {
              record: rec,
              name: fieldName,
              readonly: !isRowActive
            }));
          } else {
            const cellVal = rec?.get ? rec.get(fieldName) : (rec[fieldName] || '');
            return h('td', { class: 'p-3 border-b border-slate-100' }, h('span', { class: 'o_cell_value' }, String(cellVal)));
          }
        });

        const decorationClasses = getRowClasses(rec);
        const rowClass = [
          decorationClasses,
          isRowActive ? 'o_selected_row bg-purple-50/50' : 'hover:bg-slate-50/50'
        ].filter(Boolean).join(' ');

        return h('tr', {
          class: rowClass,
          style: 'cursor: pointer; transition: background-color 0.15s;',
          onClick: () => {
            if (editable) {
              activeRowId.value = rec.id;
            } else if (actionManager) {
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
      return h('table', { class: 'o_list_view o_subview_list w-full border-collapse' }, [thead, tbody]);
    };
  }
});
