import { defineComponent, h } from 'vue';

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
