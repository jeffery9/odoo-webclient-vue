import { h, defineComponent, computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';

// Register echarts modules
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
]);

export const PremiumGraphRenderer = defineComponent({
  name: 'PremiumGraphRenderer',
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true },
    onDrillDown: { type: Function, required: false }
  },
  setup(props: { arch: any, records: any[], onDrillDown?: (domain: any[]) => void }) {
    const chartOption = computed(() => {
      const fieldNodes = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
      const rowNode = fieldNodes.find((c: any) => c.attrs?.type === 'row') || fieldNodes[0];
      const rowFieldName = rowNode?.attrs?.name || 'name';
      const graphType = props.arch?.attrs?.type || 'bar';

      // Group records
      const groups: Record<string, number> = {};
      props.records.forEach((rec: any) => {
        let val = rec.get ? rec.get(rowFieldName) : rec[rowFieldName];
        if (typeof val === 'object' && val !== null) {
          val = val.display_name || val.name || JSON.stringify(val);
        }
        const label = String(val || 'Undefined');
        groups[label] = (groups[label] || 0) + 1;
      });

      const categories = Object.keys(groups);
      const values = Object.values(groups);

      if (graphType === 'pie') {
        const pieData = Object.entries(groups).map(([name, value]) => ({ name, value }));
        return {
          title: { text: props.arch?.attrs?.string || 'Graph Analysis', left: 'center', textStyle: { color: '#1e293b', fontSize: 16 } },
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: { orient: 'vertical', left: 'left', textStyle: { color: '#64748b' } },
          series: [
            {
              name: 'Measure',
              type: 'pie',
              radius: '60%',
              data: pieData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ]
        };
      }

      if (graphType === 'line') {
        return {
          title: { text: props.arch?.attrs?.string || 'Graph Analysis', textStyle: { color: '#1e293b', fontSize: 16 } },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: categories, axisLabel: { color: '#64748b' } },
          yAxis: { type: 'value', axisLabel: { color: '#64748b' } },
          series: [{ data: values, type: 'line', smooth: true, itemStyle: { color: '#714B67' } }]
        };
      }

      // Default: Bar Chart
      return {
        title: { text: props.arch?.attrs?.string || 'Graph Analysis', textStyle: { color: '#1e293b', fontSize: 16 } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'category', data: categories, axisLabel: { color: '#64748b' } },
        yAxis: { type: 'value', axisLabel: { color: '#64748b' } },
        series: [{ data: values, type: 'bar', itemStyle: { color: '#714B67', borderRadius: [4, 4, 0, 0] } }]
      };
    });

    return () => h('div', {
      style: 'background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'
    }, [
      h(VChart, {
        option: chartOption.value,
        style: 'height: 400px; width: 100%; cursor: pointer;',
        onClick: (params: any) => {
          if (props.onDrillDown) {
            const fieldNodes = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
            const rowNode = fieldNodes.find((c: any) => c.attrs?.type === 'row') || fieldNodes[0];
            const rowFieldName = rowNode?.attrs?.name || 'name';
            const domain = rowFieldName.endsWith('_id') 
              ? [[rowFieldName, 'ilike', params.name]] 
              : [[rowFieldName, '=', params.name]];
            props.onDrillDown(domain);
          }
        }
      })
    ]);
  }
});