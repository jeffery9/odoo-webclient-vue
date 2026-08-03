import { describe, test, expect, vi } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldMany2one } from '../../src/widgets/FieldMany2one.js';

// High-Fidelity Headless Element Plus Mock to support Vitest
vi.mock('element-plus', () => {
  const { defineComponent, h } = require('vue');
  return {
    ElSelect: defineComponent({
      props: ['modelValue', 'loading', 'remoteMethod', 'onUpdate:modelValue'],
      setup(props: any, { slots }: any) {
        return () => h('div', { class: 'mock_el_select' }, [
          h('input', {
            type: 'text',
            class: 'mock_el_select_input',
            value: props.modelValue || '',
            onInput: (e: any) => {
              if (props.remoteMethod) {
                props.remoteMethod(e.target.value);
              }
            }
          }),
          h('div', { class: 'mock_options_slot' }, slots.default ? slots.default() : [])
        ]);
      }
    }),
    ElOption: defineComponent({
      props: ['value', 'label'],
      setup(props: any) {
        return () => h('div', { class: 'mock_el_option', 'data-value': props.value }, props.label);
      }
    })
  };
});

componentRegistry.add('many2one', FieldMany2one);

describe('FieldMany2one Widget', () => {
  test('should render FieldMany2one correctly in readonly, edit, and invisible states', async () => {
    vi.useFakeTimers();
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
    const renderInvFn = many2oneWidget.setup({ record: mockRecord, name: 'user_id' }, {});
    const invVnode = renderInvFn();
    expect(invVnode).toBeNull();

    // Reset invisible check
    mockRecord.isInvisible.mockReturnValue(false);

    // 2. Readonly state with ID
    const renderReadonlyFn = many2oneWidget.setup({ record: mockRecord, name: 'user_id', readonly: true }, {});
    const readonlyVnode = renderReadonlyFn();
    expect(readonlyVnode.type).toBe('a');
    expect(readonlyVnode.props.class).toContain('o_field_many2one');
    expect(readonlyVnode.props.class).toContain('o_readonly');
    expect(readonlyVnode.children).toBe('Marc Demo');

    // 3. Readonly state with NO ID
    mockRecord.get.mockReturnValueOnce(null);
    const renderReadonlyEmptyFn = many2oneWidget.setup({ record: mockRecord, name: 'user_id', readonly: true }, {});
    const readonlyEmptyVnode = renderReadonlyEmptyFn();
    expect(readonlyEmptyVnode.type).toBe('span');
    expect(readonlyEmptyVnode.children).toBe('—');

    // 4. Edit mode
    const renderEditFn = many2oneWidget.setup({ record: mockRecord, name: 'user_id', readonly: false }, {});
    const editVnode = renderEditFn();

    expect(editVnode.type).toBe('div');
    expect(editVnode.props.class).toContain('o_field_many2one');
    expect(editVnode.props.class).toContain('o_field_widget');

    // Select component is the first child in editVnode wrapper
    const selectContainer = editVnode.children[0];
    expect(selectContainer.props.placeholder).toBe('Search...');
    expect(selectContainer.props.modelValue).toBe(42);

    // Trigger remote autocomplete search method
    selectContainer.props.remoteMethod('Marc');
    vi.advanceTimersByTime(250);
    await Promise.resolve();
    expect(mockRecord.model.sdk.rpc.call).toHaveBeenCalled();

    // Trigger update selection and assert bidirectional ORM state updates
    selectContainer.props['onUpdate:modelValue'](101);
    expect(mockRecord.set).toHaveBeenCalledWith('user_id', [101, 'Marc Demo']);
    vi.useRealTimers();
  });
});
