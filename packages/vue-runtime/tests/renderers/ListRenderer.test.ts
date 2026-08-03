import { describe, test, expect } from 'vitest';
import { ListRenderer } from '../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('ListRenderer', () => {
  const listArch = {
    type: 'list',
    children: [
      { tag: 'field', attrs: { name: 'name', string: 'Product Name' } },
      { tag: 'field', attrs: { name: 'price', string: 'Unit Price' } }
    ]
  };

  const records = [
    new RecordProxy('product.product', { id: 1, name: 'Screwdriver', price: 15.0 }),
    new RecordProxy('product.product', { id: 2, name: 'Hammer', price: 25.0 })
  ];

  test('should compile ListRenderer arch and records into dynamic VNode table trees', () => {
    // Instantiate component and capture render output
    const listInstance = ListRenderer as any;
    
    // Call the setup/render manually to inspect returned VNode structures
    const renderFn = listInstance.setup({ arch: listArch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('table');
    
    // table -> thead -> tr -> th list
    const thead = vnode.children[0];
    expect(thead.type).toBe('thead');
    const headerCols = thead.children[0].children; // array of th
    expect(headerCols[0].children).toBe('Product Name');
    expect(headerCols[1].children).toBe('Unit Price');

    // table -> tbody -> tr list
    const tbody = vnode.children[1];
    expect(tbody.type).toBe('tbody');
    expect(tbody.children.length).toBe(2); // 2 records
    
    const firstRowFirstCellSpan = tbody.children[0].children[0].children[0] || tbody.children[0].children[0].children;
    expect(firstRowFirstCellSpan.children).toBe('Screwdriver');

    const secondRowFirstCellSpan = tbody.children[1].children[0].children[0] || tbody.children[1].children[0].children;
    expect(secondRowFirstCellSpan.children).toBe('Hammer');
  });
});
