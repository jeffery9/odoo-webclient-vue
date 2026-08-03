import { describe, test, expect } from 'vitest';
import { ActivityRenderer } from '../../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('ActivityRenderer', () => {
  test('should render activities list and compute status badge dynamically', () => {
    const arch = {
      tag: 'activity',
      attrs: { string: 'Lead Activities' }
    };

    const records = [
      new RecordProxy('crm.lead', { id: 1, name: 'Lead A' }), // idx = 0 (hasActivity: true, status: 'Today')
      new RecordProxy('crm.lead', { id: 2, name: 'Lead B' }), // idx = 1 (hasActivity: false, status: 'Overdue')
      new RecordProxy('crm.lead', { id: 3, name: 'Lead C' })  // idx = 2 (hasActivity: true, status: 'Planned')
    ];

    const activityInstance = ActivityRenderer as any;
    const renderFn = activityInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_activity_view');

    // Title
    const h3 = vnode.children[0];
    expect(h3.children).toBe('Lead Activities');

    // Container
    const container = vnode.children[1];
    expect(container.type).toBe('div');
    expect(container.children.length).toBe(3);

    // First activity: Today
    const act0 = container.children[0];
    const info0 = act0.children[0];
    expect(info0.children[1].children[0].children).toBe('Lead A');
    expect(info0.children[1].children[1].children).toBe('Follow-up Email Scheduled');
    const badge0 = act0.children[1];
    expect(badge0.children).toBe('Today');
    expect(badge0.props.style).toContain('background: #E9A12E');

    // Second activity: Completed
    const act1 = container.children[1];
    const info1 = act1.children[0];
    expect(info1.children[1].children[0].children).toBe('Lead B');
    expect(info1.children[1].children[1].children).toBe('No pending activity');
    const badge1 = act1.children[1];
    expect(badge1.children).toBe('Completed');

    // Third activity: Planned
    const act2 = container.children[2];
    const info2 = act2.children[0];
    expect(info2.children[1].children[0].children).toBe('Lead C');
    expect(info2.children[1].children[1].children).toBe('Follow-up Email Scheduled');
    const badge2 = act2.children[1];
    expect(badge2.children).toBe('Planned');
    expect(badge2.props.style).toContain('background: #01A299');
  });
});
