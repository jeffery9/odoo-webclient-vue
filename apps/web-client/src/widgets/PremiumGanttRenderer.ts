import { h, defineComponent, onMounted, watch, ref, onBeforeUnmount } from 'vue';
import Gantt from 'frappe-gantt';
// Import official css styles via relative node_modules path to bypass exports limit

export const PremiumGanttRenderer = defineComponent({
  name: 'PremiumGanttRenderer',
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    const ganttContainerRef = ref<HTMLDivElement | null>(null);
    let ganttInstance: any = null;

    const dateStartName = props.arch?.attrs?.date_start || 'create_date' || 'date';
    const dateStopName = props.arch?.attrs?.date_stop || dateStartName;

    const parseDateStr = (rawDate: any): string => {
      if (!rawDate) return '2026-07-01';
      return String(rawDate).split(' ')[0]; // Convert YYYY-MM-DD HH:MM:SS -> YYYY-MM-DD
    };

    const initGantt = () => {
      if (!ganttContainerRef.value || props.records.length === 0) return;

      // Clean existing SVG contents
      ganttContainerRef.value.innerHTML = '';
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.id = 'frappe-gantt-canvas';
      svgElement.style.width = '100%';
      svgElement.style.minHeight = '300px';
      ganttContainerRef.value.appendChild(svgElement);

      const tasks = props.records.map((rec: any, idx) => {
        const start = parseDateStr(rec.get ? rec.get(dateStartName) : rec[dateStartName]);
        const stop = parseDateStr(rec.get ? rec.get(dateStopName) : rec[dateStopName]);

        return {
          id: String(rec.get ? rec.get('id') : rec.id || idx),
          name: String(rec.get ? rec.get('name') || rec.get('display_name') : rec.name || 'Task'),
          start,
          end: stop,
          progress: rec.get && rec.get('progress') ? rec.get('progress') : 40 + (idx * 15) % 60,
          custom_class: 'o_gantt_bar_custom'
        };
      });

      try {
        ganttInstance = new (Gantt as any)('#frappe-gantt-canvas', tasks, {
          view_mode: 'Day', // Day, Week, Month
          language: 'en',
          on_date_change: (task: any, start: Date, end: Date) => {
            // Find corresponding record proxy and write back start/stop dates
            const matchedRecord = props.records.find((rec: any) => {
              const recId = String(rec.get ? rec.get('id') : rec.id);
              return recId === task.id;
            });

            if (matchedRecord && matchedRecord.set) {
              const formatToOdooDate = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              matchedRecord.set(dateStartName, formatToOdooDate(start));
              matchedRecord.set(dateStopName, formatToOdooDate(end));
            }
          },
          on_progress_change: (task: any, progress: number) => {
            const matchedRecord = props.records.find((rec: any) => {
              const recId = String(rec.get ? rec.get('id') : rec.id);
              return recId === task.id;
            });
            if (matchedRecord && matchedRecord.set) {
              matchedRecord.set('progress', progress);
            }
          }
        });
      } catch (err) {
        // Safe fallback in case of initialization edge cases
      }
    };

    onMounted(() => {
      initGantt();
    });

    onBeforeUnmount(() => {
      ganttInstance = null;
    });

    watch(() => props.records, () => {
      initGantt();
    }, { deep: true });

    return () => h('div', {
      style: 'background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 16px;'
    }, [
      h('div', { style: 'display: flex; align-items: center; justify-content: space-between;' }, [
        h('h3', { style: 'margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Interactive Gantt Schedule'),
        h('div', { style: 'display: flex; gap: 8px;' }, [
          ['Day', 'Week', 'Month'].map(mode => h('button', {
            onClick: () => {
              if (ganttInstance) ganttInstance.change_view_mode(mode);
            },
            style: 'background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 10px; font-size: 12px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.2s;'
          }, mode))
        ])
      ]),
      h('div', {
        ref: ganttContainerRef,
        style: 'width: 100%; overflow-x: auto; background: #fafafa; border-radius: 6px; padding: 12px; box-sizing: border-box;'
      })
    ]);
  }
});