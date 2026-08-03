import { describe, test, expect, vi } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldDate, FieldDatetime } from '../../src/widgets/datetime.js';
import { RecordProxy } from '@odoo/sdk';

// Headless Element Plus Mock to support Vitest
vi.mock('element-plus', () => {
  const { defineComponent, h } = require('vue');
  return {
    ElDatePicker: defineComponent({
      props: ['modelValue', 'type', 'format', 'onChange', 'onUpdate:modelValue'],
      setup(props: any) {
        return () => h('input', {
          type: 'text',
          class: 'mock_el_date_picker',
          value: props.modelValue ? String(props.modelValue) : '',
          onInput: (e: any) => {
            const val = e.target.value;
            if (props['onUpdate:modelValue']) {
              props['onUpdate:modelValue'](val);
            }
          }
        });
      }
    })
  };
});

componentRegistry.add('date', FieldDate);
componentRegistry.add('datetime', FieldDatetime);

describe('Datetime Widgets', () => {
  test('should render FieldDate in edit and readonly modes', () => {
    const record = new RecordProxy('res.partner', { create_date: '2026-07-26 12:00:00' });
    const dateWidget = componentRegistry.get('date') as any;

    // 1. Edit Mode
    const renderEditFn = dateWidget.setup({ record, name: 'create_date', readonly: false }, {});
    const editVnode = renderEditFn();

    expect(editVnode.type).toBe('div');
    expect(editVnode.props.class).toBe('o_field_date_wrapper');

    const pickerNode = editVnode.children[0];
    expect(pickerNode.props.type).toBe('date');

    // Test bidirectional Odoo date formatting serializer
    pickerNode.props['onUpdate:modelValue'](new Date('2026-08-04'));
    expect(record.get('create_date')).toBe('2026-08-04');

    // 2. Readonly Mode
    const renderReadonlyFn = dateWidget.setup({ record, name: 'create_date', readonly: true }, {});
    const readonlyVnode = renderReadonlyFn();

    expect(readonlyVnode.type).toBe('span');
    expect(readonlyVnode.props.class).toBe('o_field_date o_readonly');
    expect(readonlyVnode.children).toBe('2026-08-04');
  });

  test('should render FieldDatetime in edit and readonly modes', () => {
    const record = new RecordProxy('res.partner', { create_date: '2026-07-26 12:00:00' });
    const datetimeWidget = componentRegistry.get('datetime') as any;

    // 1. Edit Mode
    const renderEditFn = datetimeWidget.setup({ record, name: 'create_date', readonly: false }, {});
    const editVnode = renderEditFn();

    expect(editVnode.type).toBe('div');
    expect(editVnode.props.class).toBe('o_field_datetime_wrapper');

    const pickerNode = editVnode.children[0];
    expect(pickerNode.props.type).toBe('datetime');

    // Test bidirectional UTC date-time formatting serializer
    pickerNode.props['onUpdate:modelValue'](new Date('2026-08-04 15:30:45'));
    expect(record.get('create_date')).toBe('2026-08-04 15:30:45');

    // 2. Readonly Mode
    const renderReadonlyFn = datetimeWidget.setup({ record, name: 'create_date', readonly: true }, {});
    const readonlyVnode = renderReadonlyFn();

    expect(readonlyVnode.type).toBe('span');
    expect(readonlyVnode.props.class).toBe('o_field_datetime o_readonly');
    expect(readonlyVnode.children).toBe('2026-08-04 15:30:45');
  });
});
