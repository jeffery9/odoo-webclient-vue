import { defineComponent, h } from 'vue';

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
