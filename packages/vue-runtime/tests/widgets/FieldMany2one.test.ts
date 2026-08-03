import { describe, test, expect, vi } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldMany2one } from '../../src/widgets/FieldMany2one.js';

componentRegistry.add('many2one', FieldMany2one);

describe('FieldMany2one Widget', () => {
  test('should render FieldMany2one correctly in readonly, edit, and invisible states', () => {
    const mockRecord = {
      get: vi.fn((name): any => [42, 'Marc Demo']),
      set: vi.fn(),
      isReadonly: vi.fn(() => false),
      isRequired: vi.fn(() => false),
      isInvisible: vi.fn(() => false),
      model: {
        fields: {
          user_id: {
            relation: 'res.users',
            string: 'User'
          }
        },
        sdk: {
          rpc: {
            call: vi.fn(() => Promise.resolve([[101, 'Marc Demo']]))
          }
        }
      }
    };

    const many2oneWidget = componentRegistry.get('many2one') as any;

    // 1. Invisible state
    mockRecord.isInvisible.mockReturnValueOnce(true);
    const invVnode = many2oneWidget.setup({ record: mockRecord, name: 'user_id' }, {})();
    expect(invVnode).toBeNull();

    // Reset invisible check
    mockRecord.isInvisible.mockReturnValue(false);

    // 2. Readonly state with ID
    const readonlyVnode = many2oneWidget.setup({ record: mockRecord, name: 'user_id', readonly: true }, {})();
    expect(readonlyVnode.type).toBe('a');
    expect(readonlyVnode.props.class).toContain('o_field_many2one');
    expect(readonlyVnode.props.class).toContain('o_readonly');
    expect(readonlyVnode.children).toBe('Marc Demo');

    // 3. Readonly state with NO ID
    mockRecord.get.mockReturnValueOnce(null);
    const readonlyEmptyVnode = many2oneWidget.setup({ record: mockRecord, name: 'user_id', readonly: true }, {})();
    expect(readonlyEmptyVnode.type).toBe('span');
    expect(readonlyEmptyVnode.children).toBe('—');

    // 4. Edit mode
    const editVnode = many2oneWidget.setup({ record: mockRecord, name: 'user_id', readonly: false }, {})();
    expect(editVnode.type).toBe('div');
    expect(editVnode.props.class).toContain('o_field_many2one');
    // Input component is the first child
    const inputContainer = editVnode.children[0];
    const input = inputContainer.children[0];
    expect(input.type).toBe('input');
    expect(input.props.placeholder).toBe('Search...');
    expect(input.props.value).toBe('Marc Demo');
  });
});
