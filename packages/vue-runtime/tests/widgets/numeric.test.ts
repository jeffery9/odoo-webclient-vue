import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldInteger, FieldFloat, FieldMonetary, FieldPercentage } from '../../src/widgets/numeric.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('integer', FieldInteger);
componentRegistry.add('float', FieldFloat);
componentRegistry.add('monetary', FieldMonetary);
componentRegistry.add('percentage', FieldPercentage);

describe('Numeric Widgets', () => {
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

  test('should render FieldMonetary number input', () => {
    const record = new RecordProxy('res.partner', { amount: 1500.5 });
    
    const monetWidget = componentRegistry.get('monetary') as any;
    const monetVnode = monetWidget.setup({ record, name: 'amount', readonly: false }, {})();
    expect(monetVnode.type).toBe('input');
    expect(monetVnode.props.type).toBe('number');

    const readonlyVnode = monetWidget.setup({ record, name: 'amount', readonly: true }, {})();
    expect(readonlyVnode.type).toBe('span');
    expect(readonlyVnode.children).toBe('1500.5');
  });

  test('should render percentage widget correctly with float math conversions', () => {
    const record = new RecordProxy('res.partner', {
      tax_rate: 0.15
    });

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
});
