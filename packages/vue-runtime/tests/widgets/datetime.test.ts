import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldDate, FieldDatetime } from '../../src/widgets/datetime.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('date', FieldDate);
componentRegistry.add('datetime', FieldDatetime);

describe('Datetime Widgets', () => {
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
});
