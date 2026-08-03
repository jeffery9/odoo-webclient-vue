import { describe, test, expect } from 'vitest';
import { componentRegistry, viewRegistry } from '../../src/registry.js';
import { FieldMany2many } from '../../src/widgets/FieldMany2many.js';
import { RecordProxy } from '@odoo/sdk';
import { ListRenderer, CardRenderer } from '../../src/renderers/index.js';

componentRegistry.add('many2many', FieldMany2many);

describe('FieldMany2many Widget', () => {
  test('should delegate to ListRenderer with default tree arch when subViews is empty', () => {
    const childRecords = [
      new RecordProxy('res.partner', { id: 1, display_name: 'Child 1' }),
      new RecordProxy('res.partner', { id: 2, display_name: 'Child 2' })
    ];
    const record = new RecordProxy('res.partner', { child_ids: childRecords });
    const widget = componentRegistry.get('many2many') as any;

    const renderFn = widget.setup({ record, name: 'child_ids', readonly: false, subViews: [] }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe(ListRenderer);
    expect(vnode.props.arch.tag).toBe('tree');
    expect(vnode.props.records).toBe(childRecords);
  });

  test('should delegate to ListRenderer with custom tree arch from subViews', () => {
    const childRecords = [
      new RecordProxy('res.partner', { id: 1, name: 'Child 1' })
    ];
    const record = new RecordProxy('res.partner', { child_ids: childRecords });
    const customArch = {
      tag: 'tree',
      children: [{ tag: 'field', attrs: { name: 'name', string: 'Custom Name' } }]
    };
    const widget = componentRegistry.get('many2many') as any;

    const renderFn = widget.setup({ record, name: 'child_ids', readonly: false, subViews: [customArch] }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe(ListRenderer);
    expect(vnode.props.arch).toBe(customArch);
  });

  test('should delegate to CardRenderer with custom card arch from subViews', () => {
    const childRecords = [
      new RecordProxy('res.partner', { id: 1, name: 'Child 1' })
    ];
    const record = new RecordProxy('res.partner', { child_ids: childRecords });
    const customCardArch = {
      tag: 'card',
      children: [{ tag: 'field', attrs: { name: 'name', string: 'Custom Name' } }]
    };
    const widget = componentRegistry.get('many2many') as any;

    const renderFn = widget.setup({ record, name: 'child_ids', readonly: false, subViews: [customCardArch] }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe(CardRenderer);
    expect(vnode.props.arch).toBe(customCardArch);
    expect(vnode.props.records).toBe(childRecords);
  });
});
