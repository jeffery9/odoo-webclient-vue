import { describe, test, expect } from 'vitest';
import { Domain } from './parser.js';

describe('Odoo Domain Parser', () => {
  test('should parse a single leaf domain', () => {
    const raw = [['state', '=', 'sale']];
    const parsed = Domain.parse(raw);
    expect(parsed).toEqual(['state', '=', 'sale']);
  });

  test('should parse implicit AND domains', () => {
    const raw = [
      ['state', '=', 'sale'],
      ['user_id', '=', 1]
    ];
    const parsed = Domain.parse(raw);
    expect(parsed).toEqual({
      operator: '&',
      operands: [
        ['state', '=', 'sale'],
        ['user_id', '=', 1]
      ]
    });
  });

  test('should parse explicit logical operators', () => {
    const raw = [
      '|',
      ['state', '=', 'sale'],
      ['user_id', '=', 1]
    ];
    const parsed = Domain.parse(raw);
    expect(parsed).toEqual({
      operator: '|',
      operands: [
        ['state', '=', 'sale'],
        ['user_id', '=', 1]
      ]
    });
  });
});

describe('Odoo Domain Normalizer', () => {
  test('should simplify redundant wrapper and operators', () => {
    const ast = {
      operator: '&' as const,
      operands: [['state', '=', 'sale'] as any]
    };
    const normalized = Domain.normalize(ast);
    expect(normalized).toEqual(['state', '=', 'sale']);
  });
});

describe('Odoo Domain Serializer (toRPC)', () => {
  test('should serialize single leaf node into simple array', () => {
    const ast = ['state', '=', 'sale'] as any;
    const rpc = Domain.toRPC(ast);
    expect(rpc).toEqual([['state', '=', 'sale']]);
  });

  test('should serialize logical and/or prefix operators', () => {
    const ast = {
      operator: '|' as const,
      operands: [
        ['state', '=', 'sale'] as any,
        {
          operator: '&' as const,
          operands: [
            ['user_id', '=', 1],
            ['active', '=', true]
          ]
        }
      ]
    };
    const rpc = Domain.toRPC(ast);
    expect(rpc).toEqual([
      '|',
      ['state', '=', 'sale'],
      '&',
      ['user_id', '=', 1],
      ['active', '=', true]
    ]);
  });
});

describe('Odoo Domain Evaluator', () => {
  const record = {
    state: 'sale',
    user_id: 1,
    active: true,
    amount: 150.5,
    name: 'Topdon OBD2'
  };

  test('should evaluate standard comparisons correctly', () => {
    expect(Domain.evaluate(['state', '=', 'sale'], record)).toBe(true);
    expect(Domain.evaluate(['state', '!=', 'draft'], record)).toBe(true);
    expect(Domain.evaluate(['amount', '>', 100], record)).toBe(true);
    expect(Domain.evaluate(['amount', '<=', 150.5], record)).toBe(true);
  });

  test('should evaluate in and not in operators', () => {
    expect(Domain.evaluate(['user_id', 'in', [1, 2, 3]], record)).toBe(true);
    expect(Domain.evaluate(['user_id', 'not in', [4, 5]], record)).toBe(true);
  });

  test('should evaluate like and ilike substring searches', () => {
    expect(Domain.evaluate(['name', 'like', 'OBD2'], record)).toBe(true);
    expect(Domain.evaluate(['name', 'ilike', 'obd2'], record)).toBe(true);
    expect(Domain.evaluate(['name', 'like', 'random'], record)).toBe(false);
  });

  test('should evaluate complex logical trees', () => {
    const ast = Domain.parse([
      '|',
      ['state', '=', 'draft'],
      '&',
      ['user_id', '=', 1],
      ['active', '=', true]
    ]);
    expect(Domain.evaluate(ast, record)).toBe(true);
  });
});
