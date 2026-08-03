import { describe, test, expect } from 'vitest';
import { CalendarRenderer } from '../../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('CalendarRenderer', () => {
  test('should render calendar grid and match records to start dates', () => {
    const arch = {
      tag: 'calendar',
      attrs: { string: 'Meetings Calendar', date_start: 'start_date' }
    };

    const records = [
      new RecordProxy('calendar.event', { id: 1, name: 'Kickoff Meeting', start_date: '2026-07-15 09:00:00' }),
      new RecordProxy('calendar.event', { id: 2, name: 'Review Session', start_date: '2026-07-20 14:00:00' })
    ];

    const calendarInstance = CalendarRenderer as any;
    const renderFn = calendarInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_calendar_view');

    // Title
    const h3 = vnode.children[0];
    expect(h3.children).toBe('Meetings Calendar');

    // Grid Container
    const grid = vnode.children[1];
    expect(grid.type).toBe('div');

    // Days headers: 7 (children[0])
    // Days slots: 35 (children[1])
    const children = grid.children;
    expect(children.length).toBe(2);
    expect(children[0].length).toBe(7);
    expect(children[1].length).toBe(35);

    // Verify day headers
    expect(children[0][0].children).toBe('Sun');
    expect(children[0][6].children).toBe('Sat');

    // Verify specific day slot content
    // Day 15 is index 14 in the days array
    const day15Slot = children[1][14];
    expect(day15Slot.children[0].children).toBe('15'); // Day number 15
    const day15Events = day15Slot.children[1].children;
    expect(day15Events.length).toBe(1);
    expect(day15Events[0].children).toBe('Kickoff Meeting');

    // Day 20 is index 19 in the days array
    const day20Slot = children[1][19];
    expect(day20Slot.children[0].children).toBe('20');
    const day20Events = day20Slot.children[1].children;
    expect(day20Events.length).toBe(1);
    expect(day20Events[0].children).toBe('Review Session');
  });
});
