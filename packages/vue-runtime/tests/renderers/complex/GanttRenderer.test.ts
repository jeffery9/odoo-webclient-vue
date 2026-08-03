import { describe, test, expect } from 'vitest';
import { GanttRenderer } from '../../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('GanttRenderer', () => {
  test('should group records into swimlanes and position task pills based on start and stop dates', () => {
    const arch = {
      tag: 'gantt',
      attrs: {
        string: 'Project Schedule',
        date_start: 'start_date',
        date_stop: 'stop_date',
        default_group_by: 'user_id'
      }
    };

    const records = [
      new RecordProxy('project.task', {
        id: 1,
        name: 'Task 1',
        start_date: '2026-07-05 08:00:00',
        stop_date: '2026-07-10 18:00:00',
        user_id: { id: 10, display_name: 'Alice' }
      }),
      new RecordProxy('project.task', {
        id: 2,
        name: 'Task 2',
        start_date: '2026-07-15 09:00:00',
        stop_date: '2026-07-20 17:00:00',
        user_id: { id: 10, display_name: 'Alice' }
      }),
      new RecordProxy('project.task', {
        id: 3,
        name: 'Task 3',
        start_date: '2026-07-10 08:00:00',
        stop_date: '2026-07-15 18:00:00',
        user_id: { id: 20, display_name: 'Bob' }
      })
    ];

    const ganttInstance = GanttRenderer as any;
    const renderFn = ganttInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_gantt_view');

    // Title
    const h3 = vnode.children[0];
    expect(h3.children).toBe('Project Schedule');

    const mainContainer = vnode.children[1];
    expect(mainContainer.type).toBe('div');

    // Main Container -> Header and Swimlanes
    const header = mainContainer.children[0];
    expect(header.type).toBe('div');

    // Header -> Group by column (USER_ID)
    const groupByHeader = header.children[0];
    expect(groupByHeader.children).toBe('USER_ID');

    // Header -> Days timeline
    const timeline = header.children[1];
    expect(timeline.children.length).toBe(31); // 31 days
    expect(timeline.children[0].children).toBe('1');
    expect(timeline.children[30].children).toBe('31');

    // Main Container -> Swimlanes
    const swimlanes = mainContainer.children[1];
    expect(swimlanes.length).toBe(2); // Alice lane, Bob lane

    // Alice lane
    const aliceLane = swimlanes[0];
    expect(aliceLane.type).toBe('div');
    expect(aliceLane.children[0].children).toBe('Alice');

    const aliceCanvas = aliceLane.children[1];
    expect(aliceCanvas.children.length).toBe(2); // [Background grid columns, Absolute positioned Gantt task pills]

    const aliceGridCols = aliceCanvas.children[0];
    expect(aliceGridCols.length).toBe(31); // 31 grid cells

    const alicePills = aliceCanvas.children[1];
    expect(alicePills.length).toBe(2); // Task 1 and Task 2
    expect(alicePills[0].children).toBe('Task 1');
    expect(alicePills[1].children).toBe('Task 2');

    // Bob lane
    const bobLane = swimlanes[1];
    expect(bobLane.children[0].children).toBe('Bob');

    const bobCanvas = bobLane.children[1];
    const bobPills = bobCanvas.children[1];
    expect(bobPills.length).toBe(1); // Task 3
    expect(bobPills[0].children).toBe('Task 3');
  });

  test('should fallback to defaults when date and group_by attributes are missing from arch', () => {
    const arch = {
      tag: 'gantt'
    };

    const records = [
      new RecordProxy('project.task', {
        id: 1,
        name: 'Task 1',
        create_date: '2026-07-01 08:00:00',
        user_id: 'Unassigned'
      })
    ];

    const ganttInstance = GanttRenderer as any;
    const renderFn = ganttInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    const h3 = vnode.children[0];
    expect(h3.children).toBe('Gantt Schedule'); // default title

    const mainContainer = vnode.children[1];
    const header = mainContainer.children[0];
    const groupByHeader = header.children[0];
    expect(groupByHeader.children).toBe('USER_ID'); // default group by field
  });
});
