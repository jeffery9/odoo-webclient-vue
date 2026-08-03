import { describe, test, expect, vi } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldSelection } from '../../src/widgets/FieldSelection.js';
import { RecordProxy } from '@odoo/sdk';

// High-Fidelity Headless Element Plus Mock to support Vitest
vi.mock('element-plus', () => {
  const { defineComponent, h } = require('vue');
  return {
    ElSelect: defineComponent({
      props: ['modelValue', 'onUpdate:modelValue'],
      setup(props: any, { slots }: any) {
        return () => h('div', { class: 'mock_el_select' }, [
          h('span', { class: 'mock_el_select_value' }, props.modelValue || ''),
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

componentRegistry.add('selection', FieldSelection);

describe('FieldSelection Widget', () => {
  test('should render FieldSelection select options list and update RecordProxy', () => {
    const record = new RecordProxy('res.partner', { state: 'done' });
    const widget = componentRegistry.get('selection') as any;

    const selectionList = [['draft', 'Draft'], ['done', 'Done']];

    // 1. Edit Mode
    const renderFn = widget.setup({ record, name: 'state', selection: selectionList, readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toContain('o_field_selection');
    expect(vnode.props.class).toContain('o_field_widget');

    const selectNode = vnode.children[0];
    expect(selectNode.props.modelValue).toBe('done');

    // Trigger update selection value and assert bidirectional ORM state updates
    selectNode.props['onUpdate:modelValue']('draft');
    expect(record.get('state')).toBe('draft');

    // 2. Readonly Mode
    const renderReadonlyFn = widget.setup({ record, name: 'state', selection: selectionList, readonly: true }, {});
    const readonlyVnode = renderReadonlyFn();

    expect(readonlyVnode.type).toBe('span');
    expect(readonlyVnode.props.class).toContain('o_field_selection');
    expect(readonlyVnode.props.class).toContain('o_readonly');
    expect(readonlyVnode.children).toBe('Draft'); // record state has updated to 'draft'!
  });
});
