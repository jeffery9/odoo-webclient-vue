import { describe, test, expect } from 'vitest';
import { FieldIcon } from '../../src/widgets/FieldIcon.js';
import { RecordProxy } from '@odoo/sdk';

describe('FieldIcon Font Awesome Widget', () => {
  test('should render clean Font Awesome icon in readonly mode', () => {
    const record = new RecordProxy('res.partner', { id: 1, icon: 'fa-star' } as any);
    const cpInstance = FieldIcon as any;
    const renderFn = cpInstance.setup({ record, name: 'icon', readonly: true }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toContain('flex');
    expect(vnode.children[0].type).toBe('i');
    expect(vnode.children[0].props.class).toBe('fa fa-star');
    expect(vnode.children[1].children).toBe('fa-star');
  });

  test('should render active el-input with live icon preview in edit mode', () => {
    const record = new RecordProxy('res.partner', { id: 1, icon: 'fa-users' } as any);
    const cpInstance = FieldIcon as any;
    const renderFn = cpInstance.setup({ record, name: 'icon', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('el-input');
    expect(vnode.props.modelValue).toBe('fa-users');
    
    // Verify prefix slot live preview icon
    const prefixIcon = vnode.children.prefix();
    expect(prefixIcon.type).toBe('i');
    expect(prefixIcon.props.class).toBe('fa fa-users');
  });
});
