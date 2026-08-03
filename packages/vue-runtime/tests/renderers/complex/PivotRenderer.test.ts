import { describe, test, expect } from 'vitest';
import { PivotRenderer } from '../../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('PivotRenderer', () => {
  const records = [
    new RecordProxy('res.partner', { id: 1, name: 'Alice', role: 'Dev' }),
    new RecordProxy('res.partner', { id: 2, name: 'Bob', role: 'Dev' }),
    new RecordProxy('res.partner', { id: 3, name: 'Alice', role: 'QA' })
  ];

  test('should render pivot table with rows and columns and totals', () => {
    const arch = {
      tag: 'pivot',
      attrs: { string: 'Partner Pivot' },
      children: [
        { tag: 'field', attrs: { name: 'name', type: 'row' } },
        { tag: 'field', attrs: { name: 'role', type: 'col' } }
      ]
    };

    const pivotInstance = PivotRenderer as any;
    const renderFn = pivotInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_pivot_view');

    // Title
    const h3 = vnode.children[0];
    expect(h3.children).toBe('Partner Pivot');

    // Table
    const table = vnode.children[1];
    expect(table.type).toBe('table');

    // thead
    const thead = table.children[0];
    expect(thead.type).toBe('thead');
    const headerRow = thead.children[0];
    const ths = headerRow.children;
    // ths: NAME, Dev, QA, Total
    expect(ths[0].children).toBe('NAME');
    expect(ths[1].children).toBe('Dev');
    expect(ths[2].children).toBe('QA');
    expect(ths[3].children).toBe('Total');

    // tbody
    const tbody = table.children[1];
    expect(tbody.type).toBe('tbody');
    // Rows: Alice, Bob, Total
    expect(tbody.children.length).toBe(3);

    // Alice Row
    const aliceRow = tbody.children[0];
    expect(aliceRow.children[0].children).toBe('Alice');
    expect(aliceRow.children[1].children).toBe('1'); // Dev
    expect(aliceRow.children[2].children).toBe('1'); // QA
    expect(aliceRow.children[3].children).toBe('2'); // Total

    // Bob Row
    const bobRow = tbody.children[1];
    expect(bobRow.children[0].children).toBe('Bob');
    expect(bobRow.children[1].children).toBe('1'); // Dev
    expect(bobRow.children[2].children).toBe('-'); // QA (not present)
    expect(bobRow.children[3].children).toBe('1'); // Total

    // Total Row
    const totalRow = tbody.children[2];
    expect(totalRow.children[0].children).toBe('Total');
    expect(totalRow.children[1].children).toBe('2'); // Dev Total
    expect(totalRow.children[2].children).toBe('1'); // QA Total
    expect(totalRow.children[3].children).toBe('3'); // Absolute Total
  });
});
