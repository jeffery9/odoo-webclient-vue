import { h, defineComponent, computed } from 'vue';
import { VuePivottableUi } from 'vue-pivottable';
// Import official CSS styles via standard package import
import 'vue-pivottable/dist/vue-pivottable.css';

export const PremiumPivotRenderer = defineComponent({
  name: 'PremiumPivotRenderer',
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    // 1. Resolve row/col field defaults from the Odoo Arch XML compiler
    const fieldNodes = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
    const rowNode = fieldNodes.find((c: any) => c.attrs?.type === 'row') || fieldNodes[0];
    const colNode = fieldNodes.find((c: any) => c.attrs?.type === 'col') || fieldNodes[1];

    const rowFieldName = rowNode?.attrs?.name || 'name';
    const colFieldName = colNode?.attrs?.name || '';

    // 2. Map Odoo reactive RecordProxy array into standard flat javascript objects
    const flatData = computed(() => {
      // Find all field keys we should extract from each record proxy
      const fieldsToExtract = Array.from(new Set([
        'id',
        'name',
        'display_name',
        rowFieldName,
        colFieldName,
        ...fieldNodes.map((n: any) => n.attrs?.name)
      ].filter(Boolean)));

      return props.records.map((rec: any) => {
        const obj: Record<string, any> = {};
        fieldsToExtract.forEach((field) => {
          let val = rec.get ? rec.get(field) : rec[field];
          if (typeof val === 'object' && val !== null) {
            val = val.display_name || val.name || JSON.stringify(val);
          }
          // Human friendly labels
          const label = field.toUpperCase().replace('_ID', '');
          obj[label] = val === undefined || val === null ? '-' : val;
        });
        return obj;
      });
    });

    // Translate Odoo field names to upper case labels
    const defaultRows = computed(() => [rowFieldName.toUpperCase().replace('_ID', '')]);
    const defaultCols = computed(() => colFieldName ? [colFieldName.toUpperCase().replace('_ID', '')] : []);

    return () => h('div', {
      style: 'background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: auto;'
    }, [
      // Inject CSS overrides directly to align VuePivottable with Odoo brand design
      h('style', null, `
        .pvtTable {
          border-collapse: collapse !important;
          font-family: system-ui, sans-serif !important;
          font-size: 13px !important;
          width: 100% !important;
        }
        .pvtTable th, .pvtTable td {
          border: 1px solid #e2e8f0 !important;
          padding: 10px 12px !important;
        }
        .pvtColLabel, .pvtRowLabel {
          background: #f8fafc !important;
          color: #475569 !important;
          font-weight: 600 !important;
        }
        .pvtAxisContainer, .pvtVals {
          background: #f8fafc !important;
          border: 1px dashed #cbd5e1 !important;
          border-radius: 6px !important;
          padding: 12px !important;
        }
        .pvtAttr {
          background: #714B67 !important;
          color: white !important;
          border: none !important;
          border-radius: 4px !important;
          padding: 6px 12px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
          cursor: grab !important;
          display: inline-flex !important;
          align-items: center !important;
        }
        .pvtAttr .pvtTriangle {
          color: rgba(255,255,255,0.7) !important;
          margin-left: 6px !important;
        }
        .pvtTotal, .pvtGrandTotal {
          font-weight: bold !important;
          background: #f1f5f9 !important;
          color: #1e293b !important;
        }
        .pvtTotalLabel {
          background: #f1f5f9 !important;
          font-weight: bold !important;
          color: #1e293b !important;
        }
        .pvtSelect {
          border: 1px solid #cbd5e1 !important;
          border-radius: 4px !important;
          padding: 6px !important;
          font-size: 12px !important;
          color: #334155 !important;
          background: white !important;
          outline: none !important;
        }
      `),
      h('div', { style: 'margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;' }, [
        h('h3', { style: 'margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Interactive Pivot Analytics'),
        h('p', { style: 'margin: 0; font-size: 12px; color: #64748b;' }, 'Drag and drop fields to dynamically pivot, aggregate, and slice your Odoo dataset.')
      ]),
      h(VuePivottableUi as any, {
        data: flatData.value,
        rows: defaultRows.value,
        cols: defaultCols.value,
        aggregatorName: 'Count',
        rendererName: 'Table'
      })
    ]);
  }
});