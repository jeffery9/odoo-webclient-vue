import { describe, test, expect, vi } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldTag } from '../../src/widgets/widgets.js';
import { RecordProxy } from '@odoo/sdk';

// Headless Element Plus Mock to support Vitest
vi.mock('element-plus', () => {
  const { defineComponent, h } = require('vue');
  return {
    ElSelect: defineComponent({
      props: ['modelValue', 'multiple', 'allowCreate', 'loading', 'remoteMethod', 'onUpdate:modelValue'],
      setup(props: any, { slots }: any) {
        return () => h('div', { class: 'mock_el_select_multiple' }, [
          h('input', {
            type: 'text',
            class: 'mock_el_select_input',
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

componentRegistry.add('many2many_tags', FieldTag);

describe('FieldTag Widget', () => {
  test('should render FieldTag correctly in edit and readonly modes', async () => {
    const initialTags = [
      { id: 1, name: 'Tag A', display_name: 'Tag A' },
      { id: 2, name: 'Tag B', display_name: 'Tag B' }
    ];

    const mockRecord = {
      get: vi.fn((name): any => initialTags),
      set: vi.fn(),
      isReadonly: vi.fn(() => false),
      isRequired: vi.fn(() => false),
      isInvisible: vi.fn(() => false),
      model: {
        fields: {
          tag_ids: {
            relation: 'res.partner.category',
            string: 'Tags'
          }
        },
        sdk: {
          rpc: {
            call: vi.fn(() => Promise.resolve([
              { id: 10, name: 'Tag X', display_name: 'Tag X' }
            ]))
          }
        }
      }
    };

    const tagWidget = componentRegistry.get('many2many_tags') as any;

    // 1. Edit Mode
    const renderEditFn = tagWidget.setup({ record: mockRecord, name: 'tag_ids', readonly: false }, {});
    const editVnode = renderEditFn();

    expect(editVnode.type).toBe('div');
    expect(editVnode.props.class).toContain('o_field_tags');
    expect(editVnode.props.class).toContain('o_field_widget');

    const selectNode = editVnode.children[0];
    expect(selectNode.props.modelValue).toEqual([1, 2]);
    expect(selectNode.props.multiple).toBe(true);
    expect(selectNode.props.allowCreate).toBe(true);

    // Trigger update selection with an existing ID and a new on-the-fly typed tag
    selectNode.props['onUpdate:modelValue']([1, 'New Dynamic Tag']);

    // Assert that the record's value updates are serialized properly with standard random ID generation
    expect(mockRecord.set).toHaveBeenCalled();
    const [nameArg, updatedTags] = mockRecord.set.mock.calls[0];
    expect(nameArg).toBe('tag_ids');
    expect(updatedTags[0].id).toBe(1);
    expect(updatedTags[1].display_name).toBe('New Dynamic Tag');

    // 2. Readonly Mode
    const renderReadonlyFn = tagWidget.setup({ record: mockRecord, name: 'tag_ids', readonly: true }, {});
    const readonlyVnode = renderReadonlyFn();

    expect(readonlyVnode.type).toBe('div');
    expect(readonlyVnode.props.class).toContain('o_field_tags');
    expect(readonlyVnode.props.class).toContain('o_readonly');

    const tagPills = readonlyVnode.children;
    expect(tagPills.length).toBe(2);
    expect(tagPills[0].type).toBe('span');
    expect(tagPills[0].props.class).toBe('o_tag_pill');
    expect(tagPills[0].children).toBe('Tag A');
  });
});
