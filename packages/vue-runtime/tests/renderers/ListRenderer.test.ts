import { describe, test, expect } from 'vitest';
import { ListRenderer } from '../../src/renderers/index.js';
import { componentRegistry } from '../../src/registry.js';
import { FieldChar } from '../../src/widgets/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('ListRenderer', () => {
  // Register widget char for renderer resolving tests
  componentRegistry.add('char', FieldChar);

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

  test('should support row click to toggle inline active edits', () => {
    const listInstance = ListRenderer as any;
    const editableArch = {
      type: 'list',
      attrs: { editable: 'top' },
      children: [
        { tag: 'field', attrs: { name: 'name', string: 'Product Name' } }
      ]
    };

    const renderFn = listInstance.setup({ arch: editableArch, records }, {});
    
    // Initial Render - all rows are read-only since activeRowId is null by default
    let vnode = renderFn();
    let tbody = vnode.children[1];

    const getWidget = (tdVNode: any) => {
      return Array.isArray(tdVNode.children) ? tdVNode.children[0] : tdVNode.children;
    };
    
    // First row cell widget prop is readonly: true
    let firstRowCellWidget = getWidget(tbody.children[0].children[0]);
    expect(firstRowCellWidget.props.readonly).toBe(true);

    // Click on row 1 to toggle edit state
    tbody.children[0].props.onClick();
    
    // Re-render and assert first row fields are edit mode (readonly: false)
    vnode = renderFn();
    tbody = vnode.children[1];
    
    firstRowCellWidget = getWidget(tbody.children[0].children[0]);
    expect(firstRowCellWidget.props.readonly).toBe(false); // Editable!

    // Second row cell widget prop remains readonly: true
    let secondRowCellWidget = getWidget(tbody.children[1].children[0]);
    expect(secondRowCellWidget.props.readonly).toBe(true);
  });

  test('should compile and evaluate dynamic row decorations via Odoo Python expressions', () => {
    const listInstance = ListRenderer as any;
    const decoratedArch = {
      type: 'list',
      attrs: {
        'decoration-danger': "price >= 20.0",
        'decoration-bf': "id == 1"
      },
      children: [
        { tag: 'field', attrs: { name: 'name', string: 'Product Name' } }
      ]
    };

    const renderFn = listInstance.setup({ arch: decoratedArch, records }, {});
    const vnode = renderFn();
    const tbody = vnode.children[1];

    // Record 1 (Screwdriver, price: 15, id: 1)
    // Matches: id == 1 -> decoration-bf -> font-bold
    // Fails: price >= 20.0
    const firstRow = tbody.children[0];
    expect(firstRow.props.class).toContain('font-bold');
    expect(firstRow.props.class).not.toContain('text-red-600');

    // Record 2 (Hammer, price: 25, id: 2)
    // Matches: price >= 20.0 -> decoration-danger -> text-red-600 font-medium
    // Fails: id == 1
    const secondRow = tbody.children[1];
    expect(secondRow.props.class).toContain('text-red-600');
    expect(secondRow.props.class).toContain('font-medium');
    expect(secondRow.props.class).not.toContain('font-bold');
  });
});
