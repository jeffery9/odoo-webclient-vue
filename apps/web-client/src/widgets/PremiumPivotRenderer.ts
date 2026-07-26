import { h, defineComponent, computed } from 'vue';
import { VuePivottableUi } from 'vue-pivottable';
// Import official CSS styles via relative path to bypass exports constraints
import '../../../../node_modules/vue-pivottable/dist/vue-pivottable.css';

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