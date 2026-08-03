import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldChar } from '../../src/widgets/FieldChar.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('char', FieldChar);

describe('FieldChar Widget', () => {
  test('should compile and register FieldChar input widget', () => {
    const record = new RecordProxy('res.partner', { name: 'Mitchell Admin' });
    const widget = componentRegistry.get('char') as any;

    const renderFn = widget.setup({ record, name: 'name', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('input');
    expect(vnode.props.value).toBe('Mitchell Admin');
  });

  test('should render FieldChar as a readonly span when set to readonly', () => {
    const record = new RecordProxy('res.partner', { name: 'Mitchell Admin' });
    const widget = componentRegistry.get('char') as any;

    const renderFn = widget.setup({ record, name: 'name', readonly: true }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('span');
    expect(vnode.props.class).toBe('o_field_char_readonly text-slate-700');
    expect(vnode.children).toBe('Mitchell Admin');
  });

  test('should render null for FieldChar when invisible', () => {
    const record = new RecordProxy('res.partner', { name: 'Mitchell Admin' });
    (record as any).isInvisible = (name: string) => name === 'name';
    const widget = componentRegistry.get('char') as any;

    const renderFn = widget.setup({ record, name: 'name', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode).toBeNull();
  });
});
