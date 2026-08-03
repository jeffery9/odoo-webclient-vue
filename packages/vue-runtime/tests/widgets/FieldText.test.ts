import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldText } from '../../src/widgets/FieldText.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('text', FieldText);

describe('FieldText Widget', () => {
  test('should render FieldText textarea element', () => {
    const record = new RecordProxy('res.partner', { comment: 'Cool project.' });
    const widget = componentRegistry.get('text') as any;

    const renderFn = widget.setup({ record, name: 'comment', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('textarea');
    expect(vnode.props.value).toBe('Cool project.');
  });
});
