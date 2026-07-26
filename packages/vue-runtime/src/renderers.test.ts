import { describe, test, expect } from 'vitest';
import { h, defineComponent } from 'vue';
import { ListRenderer, FormRenderer } from './renderers.js';
import { RecordProxy } from '@odoo/sdk';

describe('Odoo Vue View Renderers', () => {
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
    expect(tbody.children[0].children[0].children).toBe('Screwdriver');
    expect(tbody.children[1].children[0].children).toBe('Hammer');
  });

  test('should compile FormRenderer arch and single record into styled sheet layouts', () => {
    const formArch = {
      type: 'form',
      children: [
        {
          tag: 'sheet',
          children: [
            { tag: 'field', attrs: { name: 'name' } }
          ]
        }
      ]
    };

    const singleRecord = new RecordProxy('product.product', { id: 1, name: 'Screwdriver' });
    const formInstance = FormRenderer as any;

    const renderFn = formInstance.setup({ arch: formArch, record: singleRecord }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_form_view');

    // div -> sheet div -> field representation
    const sheetDiv = vnode.children[0];
    expect(sheetDiv.props.class).toBe('o_form_sheet');
    
    const fieldRepresentation = sheetDiv.children[0];
    expect(fieldRepresentation.type).toBe('span');
    expect(fieldRepresentation.props.class).toBe('o_field_widget');
    expect(fieldRepresentation.children).toBe('Screwdriver');
  });
});
