import { describe, test, expect, vi } from 'vitest';
import { FormRenderer, resolveFieldWidget } from '../../src/renderers/index.js';
import { componentRegistry } from '../../src/registry.js';
import { FieldChar } from '../../src/widgets/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('FormRenderer', () => {
  // Register widget char for renderer resolving tests
  componentRegistry.add('char', FieldChar);

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
    const record = new RecordProxy('res.partner', {
      name: 'John Doe', // char field
      rating: 3,        // integer field
    });

    // Compatible cases
    expect(resolveFieldWidget('rating', record, { widget: 'progressbar' })).toBe('progressbar');

    // Incompatible cases
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resolved = resolveFieldWidget('name', record, { widget: 'progressbar' });
    
    expect(resolved).toBe('char');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
