import { describe, test, expect, vi } from 'vitest';
import { RecordProxy } from '../../src/orm/record.js';

describe('Odoo Watch Graph & Onchange Recalculations', () => {
  test('should trigger local dependency recalculations on field changes', () => {
    const data = { id: 1, quantity: 2, price_unit: 10.0, price_subtotal: 20.0 };
    const record = new RecordProxy('sale.order.line', data);

    // Register onchange / compute rule
    // If quantity or price_unit changes, update price_subtotal
    record.registerOnchange(['quantity', 'price_unit'], (rec) => {
      const q = rec.get('quantity') || 0;
      const p = rec.get('price_unit') || 0;
      rec.set('price_subtotal', q * p);
    });

    // Write dependent field
    record.set('quantity', 5);

    // subtotal should be updated immediately!
    expect(record.get('price_subtotal')).toBe(50.0);
    expect(record.isDirty).toBe(true);
    expect(record.changes).toEqual({
      quantity: 5,
      price_subtotal: 50.0
    });
  });

  test('should not trigger onchange if written field has no registered dependencies', () => {
    const data = { id: 1, quantity: 2, price_unit: 10.0, price_subtotal: 20.0, name: 'Product A' };
    const record = new RecordProxy('sale.order.line', data);

    const spy = vi.fn();
    record.registerOnchange(['quantity'], spy);

    record.set('name', 'Product B');

    expect(spy).not.toHaveBeenCalled();
    expect(record.get('name')).toBe('Product B');
  });
});
