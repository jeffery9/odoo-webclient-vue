import { describe, test, expect } from 'vitest';
import { Expression } from '../../src/context/expression.js';

describe('Odoo Expression Parser & Evaluator', () => {
  test('should parse and evaluate single identifiers and literals', () => {
    const env = { uid: 2, active_id: 42 };
    
    expect(Expression.evaluate(Expression.parse('uid'), env)).toBe(2);
    expect(Expression.evaluate(Expression.parse('active_id'), env)).toBe(42);
    expect(Expression.evaluate(Expression.parse('42'), env)).toBe(42);
    expect(Expression.evaluate(Expression.parse("'done'"), env)).toBe('done');
  });

  test('should parse and evaluate binary comparison expressions', () => {
    const env = { state: 'sale', amount: 150 };

    expect(Expression.evaluate(Expression.parse("state == 'sale'"), env)).toBe(true);
    expect(Expression.evaluate(Expression.parse("state != 'draft'"), env)).toBe(true);
    expect(Expression.evaluate(Expression.parse("amount > 100"), env)).toBe(true);
    expect(Expression.evaluate(Expression.parse("amount <= 50"), env)).toBe(false);
  });

  test('should parse and evaluate Odoo dictionary/context literals', () => {
    const env = { uid: 5, active_id: 100 };
    const expr = "{'default_user_id': uid, 'active_id': active_id, 'readonly': True}";
    
    const parsed = Expression.parse(expr);
    const result = Expression.evaluate(parsed, env);
    
    expect(result).toEqual({
      default_user_id: 5,
      active_id: 100,
      readonly: true
    });
  });
});
