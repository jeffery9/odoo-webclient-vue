import { describe, test, expect, vi } from 'vitest';
import { componentRegistry, viewRegistry } from '../../src/registry.js';
import { FieldOne2many } from '../../src/widgets/FieldOne2many.js';
import { RecordProxy } from '@odoo/sdk';
import { ListRenderer, CardRenderer } from '../../src/renderers/index.js';

componentRegistry.add('one2many', FieldOne2many);

describe('FieldOne2many Widget', () => {
  test('should render FieldOne2many list items by delegating to ListRenderer', () => {
    const record = new RecordProxy('res.partner', { child_ids: [1, 2] });
    
    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record, name: 'child_ids', readonly: false }, {})();
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch.tag).toBe('tree');
  });

  test('should render FieldOne2many with nested sub-view tree list and inline editing', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 1, name: 'Line 1', qty: 10 }),
      new RecordProxy('res.partner.line', { id: 2, name: 'Line 2', qty: 20 })
    ];
    const parentRecord = new RecordProxy('res.partner', { line_ids: childRecords });

    const subViews = [
      {
        tag: 'tree',
        attrs: { editable: 'bottom' },
        children: [
          { tag: 'field', attrs: { name: 'name', string: 'Description' } },
          { tag: 'field', attrs: { name: 'qty', string: 'Quantity' } }
        ]
      }
    ];

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'line_ids', readonly: false, subViews }, {})();

    // Assert semantic delegation to ListRenderer
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch).toBe(subViews[0]);
    expect(o2mVnode.props.records).toBe(childRecords);
  });

  test('should delegate Form Popup Dialog on row click when editable is omitted', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 1, name: 'Line 1' })
    ];
    const parentRecord = new RecordProxy('res.partner', { line_ids: childRecords });

    const subViews = [
      {
        tag: 'tree',
        attrs: {}, // non-editable tree
        children: [
          { tag: 'field', attrs: { name: 'name', string: 'Description' } }
        ]
      }
    ];

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'line_ids', readonly: false, subViews }, {})();

    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch).toBe(subViews[0]);
  });

  test('should delegate FieldOne2many with nested sub-view card grid to CardRenderer', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 10, name: 'Card Item 1', qty: 100 })
    ];
    const parentRecord = new RecordProxy('res.partner', { card_line_ids: childRecords });

    const subViews = [
      {
        tag: 'card',
        attrs: {},
        children: [
          { tag: 'field', attrs: { name: 'name', string: 'Card Name' } },
          { tag: 'field', attrs: { name: 'qty', string: 'Qty' } }
        ]
      }
    ];

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'card_line_ids', readonly: false, subViews }, {})();

    // Assert semantic delegation to CardRenderer
    expect(o2mVnode.type).toBe(CardRenderer);
    expect(o2mVnode.props.arch).toBe(subViews[0]);
    expect(o2mVnode.props.records).toBe(childRecords);
  });

  test('should dynamically construct and delegate to ListRenderer with fallback arch when subViews is empty', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 5, display_name: 'Fallback Partner' })
    ];
    const parentRecord = new RecordProxy('res.partner', { fallback_line_ids: childRecords });

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'fallback_line_ids', readonly: false, subViews: [] }, {})();

    // Check that it delegated to ListRenderer with a dynamically constructed default fallback tree arch
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch.tag).toBe('tree');
    expect(o2mVnode.props.arch.children[1].attrs.name).toBe('display_name');
    expect(o2mVnode.props.records).toBe(childRecords);
  });

  test('should fallback to default model list in viewRegistry when subViews is empty', () => {
    const defaultListArch = {
      tag: 'tree',
      children: [
        { tag: 'field', attrs: { name: 'qty', string: 'Quantity' } }
      ]
    };
    // Register default list for res.partner.line
    viewRegistry.add('res.partner.line/list', defaultListArch);

    const childRecords = [
      new RecordProxy('res.partner.line', { id: 1, qty: 50 })
    ];
    const parentRecord = new RecordProxy('res.partner', { line_ids: childRecords });

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({
      record: parentRecord,
      name: 'line_ids',
      relation: 'res.partner.line',
      readonly: false,
      subViews: []
    }, {})();

    // Check that it falls back to the default list in viewRegistry rather than the generic fallback
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch).toBe(defaultListArch);
    expect(o2mVnode.props.arch.children[0].attrs.name).toBe('qty');
  });
});
