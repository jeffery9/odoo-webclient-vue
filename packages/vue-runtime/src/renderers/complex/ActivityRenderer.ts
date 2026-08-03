import { defineComponent, h } from 'vue';

export const ActivityRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    records: { type: Array, required: true }
  },
  setup(props: { arch: any, records: any[] }) {
    return () => {
      return h('div', { class: 'o_activity_view', style: 'padding: 24px; background: #f8fafc; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 16px;' }, [
        h('h3', { style: 'margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;' }, props.arch?.attrs?.string || 'Scheduled Activities'),
        h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' }, 
          props.records.map((rec: any, idx) => {
            const hasActivity = idx % 2 === 0;
            const status = idx % 3 === 0 ? 'Today' : idx % 3 === 1 ? 'Overdue' : 'Planned';
            const badgeColor = status === 'Today' ? '#E9A12E' : status === 'Overdue' ? '#F05555' : '#01A299';

            return h('div', {
              style: 'background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 2px rgba(0,0,0,0.02);'
            }, [
              h('div', { style: 'display: flex; align-items: center; gap: 16px;' }, [
                h('div', { style: 'font-size: 24px;' }, '📅'),
                h('div', null, [
                  h('div', { style: 'font-weight: 600; color: #1e293b; font-size: 14px;' }, rec.get('name') || rec.get('display_name')),
                  h('div', { style: 'font-size: 12px; color: #64748b; margin-top: 2px;' }, hasActivity ? 'Follow-up Email Scheduled' : 'No pending activity')
                ])
              ]),
              hasActivity ? h('span', {
                style: `background: ${badgeColor}; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600;`
              }, status) : h('span', {
                style: 'color: #94a3b8; font-size: 12px;'
              }, 'Completed')
            ]);
          })
        )
      ]);
    };
  }
});
