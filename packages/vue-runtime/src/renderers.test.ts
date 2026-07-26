import { describe, test, expect, vi } from 'vitest';
import { h, defineComponent } from 'vue';
import { ListRenderer, FormRenderer, resolveFieldWidget } from './renderers.js';
import { componentRegistry } from './registry.js';
import { FieldChar } from './widgets.js';
import { RecordProxy } from '@odoo/sdk';

describe('Odoo Vue View Renderers', () => {
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
    expect(fieldRepresentation.type).toBe(FieldChar);
    expect(fieldRepresentation.props.name).toBe('name');
    expect(fieldRepresentation.props.record).toBe(singleRecord);
  });

  test('should completely omit field node when invisible modifier evaluates to true', () => {
    const formArch = {
      type: 'form',
      children: [
        {
          tag: 'sheet',
          children: [
            { tag: 'field', attrs: { name: 'name', invisible: 'True' } } // statically invisible
          ]
        }
      ]
    };

    const singleRecord = new RecordProxy('product.product', { id: 1, name: 'Screwdriver' });
    const formInstance = FormRenderer as any;

    const renderFn = formInstance.setup({ arch: formArch, record: singleRecord }, {});
    const vnode = renderFn();

    const sheetDiv = vnode.children[0];
    expect(sheetDiv.children.length).toBe(0); // field omitted!
  });

  test('should pass evaluated readonly and parsed options to the resolved widget', () => {
    const formArch = {
      type: 'form',
      children: [
        {
          tag: 'sheet',
          children: [
            { tag: 'field', attrs: { name: 'name', readonly: 'True', options: "{'no_open': true}" } }
          ]
        }
      ]
    };

    const singleRecord = new RecordProxy('product.product', { id: 1, name: 'Screwdriver' });
    const formInstance = FormRenderer as any;

    const renderFn = formInstance.setup({ arch: formArch, record: singleRecord }, {});
    const vnode = renderFn();

    const sheetDiv = vnode.children[0];
    const fieldVnode = sheetDiv.children[0];

    expect(fieldVnode.props.readonly).toBe(true);
    expect(fieldVnode.props.options).toEqual({ no_open: true });
  });

  test('should enforce widget-field compatibility and auto-fallback to native type on error', () => {
    // Import resolveFieldWidget
    const record = new RecordProxy('res.partner', {
      name: 'John Doe', // char field
      rating: 3,        // integer field
    });

    // 1. Compatible cases
    // progressbar on integer is compatible
    expect(resolveFieldWidget('rating', record, { widget: 'progressbar' })).toBe('progressbar');

    // 2. Incompatible cases
    // progressbar on char field is incompatible! Should fallback to field's native type ('char')
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resolved = resolveFieldWidget('name', record, { widget: 'progressbar' });
    
    expect(resolved).toBe('char');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
