import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldSelection } from '../../src/widgets/FieldSelection.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('selection', FieldSelection);

describe('FieldSelection Widget', () => {
  test('should render FieldSelection select options list', () => {
    const record = new RecordProxy('res.partner', { state: 'done' });
    const widget = componentRegistry.get('selection') as any;

    const selectionList = [['draft', 'Draft'], ['done', 'Done']];
    const renderFn = widget.setup({ record, name: 'state', selection: selectionList, readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('select');
    expect(vnode.children.length).toBe(2);
  });
});
