import { defineComponent, h } from 'vue';

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
