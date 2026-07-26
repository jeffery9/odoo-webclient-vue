import { describe, test, expect } from 'vitest';
import { h, defineComponent } from 'vue';
import { componentRegistry } from './registry.js';
import {
  FieldChar,
  FieldText,
  FieldHtml,
  FieldInteger,
  FieldFloat,
  FieldMonetary,
  FieldBoolean,
  FieldSelection,
  FieldDate,
  FieldDatetime,
  FieldMany2one,
  FieldOne2many,
  FieldMany2many
} from './widgets.js';
import { RecordProxy } from '@odoo/sdk';

describe('Odoo Vue Base UI Widgets', () => {
  // Populate components in registry for rendering tests
  componentRegistry.add('char', FieldChar);
  componentRegistry.add('text', FieldText);
  componentRegistry.add('html', FieldHtml);
  componentRegistry.add('integer', FieldInteger);
  componentRegistry.add('float', FieldFloat);
  componentRegistry.add('monetary', FieldMonetary);
  componentRegistry.add('boolean', FieldBoolean);
  componentRegistry.add('selection', FieldSelection);
  componentRegistry.add('date', FieldDate);
  componentRegistry.add('datetime', FieldDatetime);
  componentRegistry.add('many2one', FieldMany2one);
  componentRegistry.add('one2many', FieldOne2many);
  componentRegistry.add('many2many', FieldMany2many);

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
    expect(vnode.props.class).toBe('o_field_char o_readonly');
    expect(vnode.children).toBe('Mitchell Admin');
  });

  test('should render FieldText textarea element', () => {
    const record = new RecordProxy('res.partner', { comment: 'Cool project.' });
    const widget = componentRegistry.get('text') as any;

    const renderFn = widget.setup({ record, name: 'comment', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('textarea');
    expect(vnode.props.value).toBe('Cool project.');
  });

  test('should render FieldHtml contenteditable div', () => {
    const record = new RecordProxy('res.partner', { note: '<p>Great!</p>' });
    const widget = componentRegistry.get('html') as any;

    const renderFn = widget.setup({ record, name: 'note', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.contenteditable).toBe(true);
  });

  test('should render FieldInteger and FieldFloat number input', () => {
    const record = new RecordProxy('res.partner', { sequence: 10, amount: 15.5 });
    
    const intWidget = componentRegistry.get('integer') as any;
    const intVnode = intWidget.setup({ record, name: 'sequence', readonly: false }, {})();
    expect(intVnode.type).toBe('input');
    expect(intVnode.props.type).toBe('number');

    const floatWidget = componentRegistry.get('float') as any;
    const floatVnode = floatWidget.setup({ record, name: 'amount', readonly: false }, {})();
    expect(floatVnode.type).toBe('input');
    expect(floatVnode.props.type).toBe('number');
  });

  test('should compile and register FieldBoolean checkbox widget', () => {
    const record = new RecordProxy('res.partner', { active: true });
    const widget = componentRegistry.get('boolean') as any;

    const renderFn = widget.setup({ record, name: 'active', readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('input');
    expect(vnode.props.type).toBe('checkbox');
    expect(vnode.props.checked).toBe(true);
  });

  test('should render FieldSelection select options list', () => {
    const record = new RecordProxy('res.partner', { state: 'done' });
    const widget = componentRegistry.get('selection') as any;

    const selectionList = [['draft', 'Draft'], ['done', 'Done']];
    const renderFn = widget.setup({ record, name: 'state', selection: selectionList, readonly: false }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('select');
    expect(vnode.children.length).toBe(2);
  });

  test('should render FieldDate and FieldDatetime calendars', () => {
    const record = new RecordProxy('res.partner', { create_date: '2026-07-26 12:00:00' });
    
    const dateWidget = componentRegistry.get('date') as any;
    const dateVnode = dateWidget.setup({ record, name: 'create_date', readonly: false }, {})();
    expect(dateVnode.type).toBe('input');
    expect(dateVnode.props.type).toBe('date');

    const datetimeWidget = componentRegistry.get('datetime') as any;
    const datetimeVnode = datetimeWidget.setup({ record, name: 'create_date', readonly: false }, {})();
    expect(datetimeVnode.type).toBe('input');
    expect(datetimeVnode.props.type).toBe('datetime-local');
  });

  test('should render FieldOne2many and FieldMany2many list items', () => {
    const record = new RecordProxy('res.partner', { child_ids: [1, 2] });
    
    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record, name: 'child_ids', readonly: false }, {})();
    expect(o2mVnode.type).toBe('div');
    expect(o2mVnode.children[0].length).toBe(2); // 2 tag spans
  });
});
