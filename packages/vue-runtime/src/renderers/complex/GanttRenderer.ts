import { defineComponent, h } from 'vue';

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
              h('div', { style: 'width: 180px; padding: 12px; font-size: 13px; font-weight: 500; color: #1e293b; border-right: 1px solid #e2e8f0; flex-shrink: 0; background: #f8fafc;' }, laneName),
              
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
