import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldBoolean } from '../../src/widgets/FieldBoolean.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('boolean', FieldBoolean);

describe('FieldBoolean Widget', () => {
  test('should compile and register FieldBoolean checkbox widget', () => {
    const record = new RecordProxy('res.partner', { active: true });
    const widget = componentRegistry.get('boolean') as any;

    const renderFn = widget.setup({ record, name: 'active', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('input');
    expect(vnode.props.type).toBe('checkbox');
    expect(vnode.props.checked).toBe(true);
  });
});
