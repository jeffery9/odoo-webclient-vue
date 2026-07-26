import { describe, test, expect, vi } from 'vitest';
import { h, defineComponent } from 'vue';
import { componentRegistry, viewRegistry, modelFieldRegistry } from './registry.js';
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
  FieldMany2many,
  FieldUrl,
  FieldEmail,
  FieldPhone,
  FieldBadge,
  FieldProgressBar,
  FieldPriority,
  FieldImage,
  FieldHandle,
  FieldTag,
  FieldPercentage
} from './widgets.js';
import { RecordProxy } from '@odoo/sdk';
import { ListRenderer, CardRenderer, resolveFieldWidget, FormRenderer } from './renderers.js';

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
  componentRegistry.add('url', FieldUrl);
  componentRegistry.add('email', FieldEmail);
  componentRegistry.add('phone', FieldPhone);
  componentRegistry.add('badge', FieldBadge);
  componentRegistry.add('progressbar', FieldProgressBar);
  componentRegistry.add('priority', FieldPriority);
  componentRegistry.add('image', FieldImage);
  componentRegistry.add('handle', FieldHandle);
  componentRegistry.add('tag', FieldTag);
  componentRegistry.add('percentage', FieldPercentage);

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
    expect(dateVnode.type).toBe('div');
    expect(dateVnode.props.class).toBe('o_field_date_container');
    expect(dateVnode.children[0].props.class).toBe('o_datepicker_input_group');
    expect(dateVnode.children[0].children[0].children).toBe('2026-07-26');

    const datetimeWidget = componentRegistry.get('datetime') as any;
    const datetimeVnode = datetimeWidget.setup({ record, name: 'create_date', readonly: false }, {})();
    expect(datetimeVnode.type).toBe('input');
    expect(datetimeVnode.props.type).toBe('datetime-local');
  });

  test('should render FieldOne2many and FieldMany2many list items by delegating to ListRenderer', () => {
    const record = new RecordProxy('res.partner', { child_ids: [1, 2] });
    
    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record, name: 'child_ids', readonly: false }, {})();
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch.tag).toBe('tree');
  });

  test('should render FieldOne2many with nested sub-view tree list and inline editing', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 1, name: 'Line 1', qty: 10 }),
      new RecordProxy('res.partner.line', { id: 2, name: 'Line 2', qty: 20 })
    ];
    const parentRecord = new RecordProxy('res.partner', { line_ids: childRecords });

    const subViews = [
      {
        tag: 'tree',
        attrs: { editable: 'bottom' },
        children: [
          { tag: 'field', attrs: { name: 'name', string: 'Description' } },
          { tag: 'field', attrs: { name: 'qty', string: 'Quantity' } }
        ]
      }
    ];

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'line_ids', readonly: false, subViews }, {})();

    // Assert semantic delegation to ListRenderer
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch).toBe(subViews[0]);
    expect(o2mVnode.props.records).toBe(childRecords);
  });

  test('should delegate Form Popup Dialog on row click when editable is omitted', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 1, name: 'Line 1' })
    ];
    const parentRecord = new RecordProxy('res.partner', { line_ids: childRecords });

    const subViews = [
      {
        tag: 'tree',
        attrs: {}, // non-editable tree
        children: [
          { tag: 'field', attrs: { name: 'name', string: 'Description' } }
        ]
      }
    ];

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'line_ids', readonly: false, subViews }, {})();

    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch).toBe(subViews[0]);
  });

  test('should delegate FieldOne2many with nested sub-view card grid to CardRenderer', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 10, name: 'Card Item 1', qty: 100 })
    ];
    const parentRecord = new RecordProxy('res.partner', { card_line_ids: childRecords });

    const subViews = [
      {
        tag: 'card',
        attrs: {},
        children: [
          { tag: 'field', attrs: { name: 'name', string: 'Card Name' } },
          { tag: 'field', attrs: { name: 'qty', string: 'Qty' } }
        ]
      }
    ];

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'card_line_ids', readonly: false, subViews }, {})();

    // Assert semantic delegation to CardRenderer
    expect(o2mVnode.type).toBe(CardRenderer);
    expect(o2mVnode.props.arch).toBe(subViews[0]);
    expect(o2mVnode.props.records).toBe(childRecords);
  });

  test('should dynamically construct and delegate to ListRenderer with fallback arch when subViews is empty', () => {
    const childRecords = [
      new RecordProxy('res.partner.line', { id: 5, display_name: 'Fallback Partner' })
    ];
    const parentRecord = new RecordProxy('res.partner', { fallback_line_ids: childRecords });

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({ record: parentRecord, name: 'fallback_line_ids', readonly: false, subViews: [] }, {})();

    // Check that it delegated to ListRenderer with a dynamically constructed default fallback tree arch
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch.tag).toBe('tree');
    expect(o2mVnode.props.arch.children[1].attrs.name).toBe('display_name');
    expect(o2mVnode.props.records).toBe(childRecords);
  });

  test('should fallback to default model list in viewRegistry when subViews is empty', () => {
    const defaultListArch = {
      tag: 'tree',
      children: [
        { tag: 'field', attrs: { name: 'qty', string: 'Quantity' } }
      ]
    };
    // Register default list for res.partner.line
    viewRegistry.add('res.partner.line/list', defaultListArch);

    const childRecords = [
      new RecordProxy('res.partner.line', { id: 1, qty: 50 })
    ];
    const parentRecord = new RecordProxy('res.partner', { line_ids: childRecords });

    const o2mWidget = componentRegistry.get('one2many') as any;
    const o2mVnode = o2mWidget.setup({
      record: parentRecord,
      name: 'line_ids',
      relation: 'res.partner.line',
      readonly: false,
      subViews: []
    }, {})();

    // Check that it falls back to the default list in viewRegistry rather than the generic fallback
    expect(o2mVnode.type).toBe(ListRenderer);
    expect(o2mVnode.props.arch).toBe(defaultListArch);
    expect(o2mVnode.props.arch.children[0].attrs.name).toBe('qty');
  });

  test('should render new specialized widgets correctly', () => {
    const record = new RecordProxy('res.partner', {
      website: 'https://odoo.com',
      email_addr: 'test@odoo.com',
      mobile: '+12345678',
      status: 'active',
      progress: 75,
      stars: 3,
      avatar: 'data:image/png;base64,mock',
      sequence: 1
    });

    // 1. URL
    const urlWidget = componentRegistry.get('url') as any;
    const urlVnode = urlWidget.setup({ record, name: 'website', readonly: true }, {})();
    expect(urlVnode.type).toBe('a');
    expect(urlVnode.props.href).toBe('https://odoo.com');

    // 2. Email
    const emailWidget = componentRegistry.get('email') as any;
    const emailVnode = emailWidget.setup({ record, name: 'email_addr', readonly: true }, {})();
    expect(emailVnode.type).toBe('a');
    expect(emailVnode.props.href).toBe('mailto:test@odoo.com');

    // 3. Phone
    const phoneWidget = componentRegistry.get('phone') as any;
    const phoneVnode = phoneWidget.setup({ record, name: 'mobile', readonly: true }, {})();
    expect(phoneVnode.type).toBe('a');
    expect(phoneVnode.props.href).toBe('tel:+12345678');

    // 4. Badge
    const badgeWidget = componentRegistry.get('badge') as any;
    const badgeVnode = badgeWidget.setup({ record, name: 'status', readonly: true }, {})();
    expect(badgeVnode.type).toBe('span');
    expect(badgeVnode.props.class).toBe('o_badge');

    // 5. Progressbar
    const progressWidget = componentRegistry.get('progressbar') as any;
    const progressVnode = progressWidget.setup({ record, name: 'progress', readonly: true }, {})();
    expect(progressVnode.type).toBe('div');
    expect(progressVnode.children[0].props.style).toContain('width: 75%');

    // 6. Priority
    const priorityWidget = componentRegistry.get('priority') as any;
    const priorityVnode = priorityWidget.setup({ record, name: 'stars', readonly: false }, {})();
    expect(priorityVnode.children.length).toBe(5);
    // Click 4th star to set priority to 4
    priorityVnode.children[3].props.onClick();
    expect(record.get('stars')).toBe(4);

    // 7. Image
    const imageWidget = componentRegistry.get('image') as any;
    const imageVnode = imageWidget.setup({ record, name: 'avatar', readonly: true }, {})();
    expect(imageVnode.type).toBe('img');
    expect(imageVnode.props.src).toBe('data:image/png;base64,mock');

    // 8. Handle
    const handleWidget = componentRegistry.get('handle') as any;
    const handleVnode = handleWidget.setup({ record, name: 'sequence', readonly: true }, {})();
    expect(handleVnode.type).toBe('span');
    expect(handleVnode.children).toBe('☰');
  });

  test('should render widget tag and percentage correctly with float math conversions', () => {
    const record = new RecordProxy('res.partner', {
      tag_ids: [
        [1, 'Consulting'],
        [2, 'VIP']
      ],
      tax_rate: 0.15
    });

    // 1. Tag / Tags widget
    const tagWidget = componentRegistry.get('tag') as any;
    const tagVnode = tagWidget.setup({ record, name: 'tag_ids', readonly: true }, {})();
    expect(tagVnode.type).toBe('div');
    expect(tagVnode.props.class).toBe('o_field_tags');
    expect(tagVnode.children.length).toBe(2);
    expect(tagVnode.children[0].children).toBe('Consulting');
    expect(tagVnode.children[1].children).toBe('VIP');

    // 2. Percentage widget
    const percentageWidget = componentRegistry.get('percentage') as any;
    const percentageVnode = percentageWidget.setup({ record, name: 'tax_rate', readonly: false }, {})();
    
    // Readonly / Display percentage value is multiplied by 100
    const readonlyVnode = percentageWidget.setup({ record, name: 'tax_rate', readonly: true }, {})();
    expect(readonlyVnode.children).toBe('15%');

    // Edit input value is 15
    const input = percentageVnode.children[0];
    expect(input.props.value).toBe(15);

    // Typing 50 in edit mode should write 0.50 back to record
    input.props.onInput({ target: { value: '50' } });
    expect(record.get('tax_rate')).toBe(0.5);
  });

  test('should dynamically resolve widgets matching field types when widget attribute is omitted in arch', () => {
    const record = new RecordProxy('res.partner', {
      active: true, // boolean (type inferred)
      sequence: 12, // registered integer
      custom_rate: 0.08, // registered float
      comment: 'Nice fallback' // type inferred text
    });

    // 1. Register static model field types in modelFieldRegistry
    viewRegistry.add('res.partner.line/list', {}); // unrelated registry call to keep it clean
    modelFieldRegistry.add('res.partner/sequence', 'integer');
    modelFieldRegistry.add('res.partner/custom_rate', 'float');

    // 2. Assert direct widget overrides take supreme precedence
    expect(resolveFieldWidget('active', record, { widget: 'progressbar' })).toBe('progressbar');

    // 3. Assert type-based attributes take precedence
    expect(resolveFieldWidget('active', record, { type: 'boolean' })).toBe('boolean');

    // 4. Assert modelFieldRegistry lookup matches
    expect(resolveFieldWidget('sequence', record, {})).toBe('integer');
    expect(resolveFieldWidget('custom_rate', record, {})).toBe('float');

    // 5. Assert value-based type inference (Heuristics)
    expect(resolveFieldWidget('active', record, {})).toBe('boolean');
    expect(resolveFieldWidget('comment', record, {})).toBe('text');

    // 6. Assert default fallback
    expect(resolveFieldWidget('unregistered_field', record, {})).toBe('char');
  });
});
