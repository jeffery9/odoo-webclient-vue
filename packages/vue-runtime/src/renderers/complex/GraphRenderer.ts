import { defineComponent, h, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts';

export const GraphRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    const activeType = ref<'bar' | 'line' | 'pie'>(props.arch?.attrs?.type || 'bar');
    const canvasRef = ref<HTMLDivElement | null>(null);
    let myChart: echarts.ECharts | null = null;

    const chartOption = computed(() => {
      // Extract group-by and row fields
      const fieldNodes = (props.arch?.children || []).filter((c: any) => c.tag === 'field');
      const rowNode = fieldNodes.find((c: any) => c.attrs?.type === 'row') || fieldNodes[0];
      const rowFieldName = rowNode?.attrs?.name || 'name';

      // Perform dynamic data compilation
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
      const labels = dataEntries.map(e => e[0]);
      const values = dataEntries.map(e => e[1]);

      const colors = ['#714B67', '#01A299', '#EC9A29', '#E85F5C', '#1F7A8C'];

      if (activeType.value === 'pie') {
        return {
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: { orient: 'vertical', left: 'left', textStyle: { color: '#475569' } },
          color: colors,
          series: [
            {
              type: 'pie',
              radius: '65%',
              center: ['60%', '50%'],
              data: dataEntries.map(e => ({ name: e[0], value: e[1] })),
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

      if (activeType.value === 'line') {
        return {
          tooltip: { trigger: 'axis' },
          grid: { top: '15%', bottom: '15%', left: '10%', right: '10%', containLabel: true },
          color: colors,
          xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#64748b' },
            axisLine: { lineStyle: { color: '#cbd5e1' } }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
          },
          series: [
            {
              data: values,
              type: 'line',
              smooth: true,
              lineStyle: { width: 3 },
              symbolSize: 8
            }
          ]
        };
      }

      // Default: Bar Chart
      return {
        tooltip: { trigger: 'axis' },
        grid: { top: '15%', bottom: '15%', left: '10%', right: '10%', containLabel: true },
        color: colors,
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: { color: '#64748b' },
          axisLine: { lineStyle: { color: '#cbd5e1' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [
          {
            data: values,
            type: 'bar',
            barWidth: '40%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      };
    });

    onMounted(() => {
      if (canvasRef.value) {
        myChart = echarts.init(canvasRef.value);
        myChart.setOption(chartOption.value);

        // Reactively update options on change
        watch(chartOption, (newOption) => {
          myChart?.setOption(newOption, true);
        });

        // Register observer for responsive resizing
        const observer = new ResizeObserver(() => {
          myChart?.resize();
        });
        observer.observe(canvasRef.value);
      }
    });

    onBeforeUnmount(() => {
      myChart?.dispose();
    });

    return () => {
      const renderToggleBtn = (type: 'bar' | 'line' | 'pie', label: string) => {
        const isActive = activeType.value === type;
        return h('button', {
          type: 'button',
          onClick: () => { activeType.value = type; },
          style: {
            padding: '4px 12px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            backgroundColor: isActive ? '#714B67' : '#ffffff',
            color: isActive ? '#ffffff' : '#475569',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            transition: 'all 0.15s ease'
          }
        }, label);
      };

      return h('div', {
        class: 'o_graph_view',
        style: {
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }
      }, [
        h('div', {
          class: 'o_graph_header',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px'
          }
        }, [
          h('h3', { style: 'margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Graph Analysis'),
          h('div', {
            class: 'o_graph_buttons',
            style: { display: 'flex', gap: '4px' }
          }, [
            renderToggleBtn('bar', 'Bar Chart'),
            renderToggleBtn('line', 'Line Chart'),
            renderToggleBtn('pie', 'Pie Chart')
          ])
        ]),

        h('div', {
          ref: canvasRef,
          class: 'o_graph_canvas',
          style: {
            width: '100%',
            height: '320px',
            minHeight: '280px'
          }
        })
      ]);
    };
  }
});
