import { describe, test, expect, vi } from 'vitest';
import { h, defineComponent } from 'vue';
import { ListRenderer, FormRenderer, QWebRenderer, resolveFieldWidget } from './renderers/index.js';
import { componentRegistry } from './registry.js';
import { FieldChar } from './widgets/index.js';
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
    const sheetBg = vnode.children[0];
    expect(sheetBg.props.class).toBe('o_form_sheet_bg');
    const sheetDiv = sheetBg.children[0];
    expect(sheetDiv.props.class).toBe('o_form_sheet');
    
    const fieldRepresentation = sheetDiv.children[0];
    expect(fieldRepresentation.type).toBe(FieldChar);
    expect(fieldRepresentation.props.name).toBe('name');
    expect(fieldRepresentation.props.record).toBe(singleRecord);
  });

  test('should compile FormRenderer Odoo groups and nested grid layouts (Task 7.2)', () => {
    const formArch = {
      type: 'form',
      children: [
        {
          tag: 'sheet',
          children: [
            {
              tag: 'group', // Outer group (contains inner group)
              children: [
                {
                  tag: 'group', // Inner group 1 (contains fields)
                  children: [
                    { tag: 'field', attrs: { name: 'name', string: 'Main Title' } },
                    { tag: 'field', attrs: { name: 'rating', nolabel: '1' } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const singleRecord = new RecordProxy('product.product', { id: 1, name: 'Screwdriver', rating: 5 });
    const formInstance = FormRenderer as any;

    const renderFn = formInstance.setup({ arch: formArch, record: singleRecord }, {});
    const vnode = renderFn();

    // div.o_form_view -> div.o_form_sheet_bg -> div.o_form_sheet -> div.o_group -> div.o_inner_group -> children
    const sheetBg = vnode.children[0];
    expect(sheetBg.props.class).toBe('o_form_sheet_bg');
    
    const sheet = sheetBg.children[0];
    expect(sheet.props.class).toBe('o_form_sheet');

    const outerGroup = sheet.children[0];
    expect(outerGroup.props.class).toBe('o_group');
    expect(outerGroup.props.style).toContain('display: flex');

    const innerGroup = outerGroup.children[0];
    expect(innerGroup.props.class).toBe('o_inner_group');
    expect(innerGroup.props.style).toContain('display: grid');

    // Inside inner group:
    // field 1 should return [labelVnode, fieldVnode] because it has no nolabel attribute
    const label1 = innerGroup.children[0];
    expect(label1.type).toBe('label');
    expect(label1.props.class).toBe('o_form_label');
    expect(label1.children).toBe('Main Title');

    const field1 = innerGroup.children[1];
    expect(field1.type).toBe(FieldChar);
    expect(field1.props.name).toBe('name');

    // field 2 has nolabel="1", so it should directly render the widget without a label
    const field2 = innerGroup.children[2];
    expect(field2.type).toBe(FieldChar); // Fallback resolved type for rating is char in test mocks
    expect(field2.props.name).toBe('rating');
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

    const sheetBg = vnode.children[0];
    const sheetDiv = sheetBg.children[0];
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

    const sheetBg = vnode.children[0];
    const sheetDiv = sheetBg.children[0];
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

describe('Odoo QWeb Renderer Integration', () => {
  test('should render basic elements and evaluate conditional t-if', () => {
    const arch = {
      tag: 'div',
      attrs: { class: 'container' },
      children: [
        {
          tag: 't',
          type: 'if',
          expr: "state == 'done'",
          children: [
            { tag: 'span', attrs: { class: 'success-badge' } }
          ]
        },
        {
          tag: 't',
          type: 'if',
          expr: "state == 'draft'",
          children: [
            { tag: 'span', attrs: { class: 'draft-badge' } }
          ]
        }
      ]
    };

    const context = { state: 'done' };
    const qwebInstance = QWebRenderer as any;
    const renderFn = qwebInstance.setup({ arch, context }, {});
    const vnode = renderFn();

    // vnode -> outer div class='o_qweb_view' -> inner div class='container'
    const container = vnode.children[0];
    expect(container.type).toBe('div');
    expect(container.props.class).toBe('container');

    // Only state == 'done' is rendered
    expect(container.children.length).toBe(2);
    // index 0 contains the children of 'done' branch spans
    const doneBranch = container.children[0];
    expect(doneBranch[0].type).toBe('span');
    expect(doneBranch[0].props.class).toBe('success-badge');

    // index 1 is draft branch which is null/empty
    expect(container.children[1]).toBeNull();
  });

  test('should render dynamic loops and text interpolation using t-foreach and t-esc', () => {
    const arch = {
      tag: 'ul',
      attrs: { class: 'items-list' },
      children: [
        {
          tag: 't',
          type: 'foreach',
          expr: 'items',
          as: 'row',
          children: [
            {
              tag: 'li',
              attrs: { class: 'item' },
              children: [
                {
                  tag: 'span',
                  attrs: { 't-esc': 'row' }
                }
              ]
            }
          ]
        }
      ]
    };

    const context = { items: ['Apples', 'Bananas', 'Cherries'] };
    const qwebInstance = QWebRenderer as any;
    const renderFn = qwebInstance.setup({ arch, context }, {});
    const vnode = renderFn();

    const list = vnode.children[0];
    expect(list.type).toBe('ul');

    const loopOutput = list.children[0]; // array of evaluated items
    expect(loopOutput.length).toBe(3);

    // Apple row
    const appleRow = loopOutput[0][0]; // nested due to child array
    expect(appleRow.type).toBe('li');
    expect(appleRow.children[0].type).toBe('span');
    expect(appleRow.children[0].children).toBe('Apples');

    // Banana row
    const bananaRow = loopOutput[1][0];
    expect(bananaRow.type).toBe('li');
    expect(bananaRow.children[0].type).toBe('span');
    expect(bananaRow.children[0].children).toBe('Bananas');
  });
});
