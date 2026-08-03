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

  test('should render FieldMonetary with dynamic Odoo currency mapping', () => {
    // 1. Setup mock session with currencies metadata
    const mockSession = {
      currencies: {
        3: { symbol: '¥', position: 'before' },
        1: { symbol: '$', position: 'after' }
      },
      userContext: { lang: 'zh_CN' }
    };

    const record = new RecordProxy('res.partner', { amount: 1500.5, currency_id: [3, 'CNY'] });
    (record as any).model = {
      session: mockSession
    };

    const monetWidget = componentRegistry.get('monetary') as any;

    // 2. Edit Mode (Currency symbol placement: before)
    const editVnode = monetWidget.setup({ record, name: 'amount', readonly: false }, {})();
    expect(editVnode.type).toBe('div');
    expect(editVnode.props.class).toContain('o_field_monetary');
    
    // Grid alignment: [¥ badge, input box]
    const symbolNode = editVnode.children[0];
    const inputNode = editVnode.children[1];
    
    expect(symbolNode.children).toBe('¥');
    expect(inputNode.type).toBe('input');
    expect(inputNode.props.value).toBe(1500.5);

    // 3. Readonly Mode (Locale formatted currencies with decimals)
    const readonlyVnode = monetWidget.setup({ record, name: 'amount', readonly: true }, {})();
    expect(readonlyVnode.type).toBe('span');
    expect(readonlyVnode.props.class).toContain('o_field_monetary');
    expect(readonlyVnode.props.class).toContain('o_readonly');
    
    // Chinese local format: ¥1,500.50
    expect(readonlyVnode.children).toBe('¥1,500.50');
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
