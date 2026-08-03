import { describe, test, expect } from 'vitest';
import { Fields } from '../../src/orm/fields.js';

describe('Odoo Field Lifecycles & Relational Serializers', () => {
  describe('Base Field Parsers & Formatters', () => {
    test('should parse and format Char correctly', () => {
      expect(Fields.Char.parse(123)).toBe('123');
      expect(Fields.Char.parse(null)).toBe('');
      expect(Fields.Char.format('Mitchell')).toBe('Mitchell');
    });

    test('should parse and format Integer correctly', () => {
      expect(Fields.Integer.parse('42')).toBe(42);
      expect(Fields.Integer.parse(12.8)).toBe(13); // round to nearest integer
      expect(Fields.Integer.parse(null)).toBe(0);
      expect(Fields.Integer.format(42)).toBe('42');
    });

    test('should parse and format Float correctly', () => {
      expect(Fields.Float.parse('99.95')).toBe(99.95);
      expect(Fields.Float.parse(null)).toBe(0.0);
      expect(Fields.Float.format(1200.5)).toBe('1200.5');
    });

    test('should parse and format Boolean correctly', () => {
      expect(Fields.Boolean.parse('true')).toBe(true);
      expect(Fields.Boolean.parse('')).toBe(false);
      expect(Fields.Boolean.parse(null)).toBe(false);
      expect(Fields.Boolean.format(true)).toBe('Yes');
      expect(Fields.Boolean.format(false)).toBe('No');
    });

    test('should parse and format Text/Html/Monetary correctly', () => {
      expect(Fields.Text.parse('Multi\nLine')).toBe('Multi\nLine');
      expect(Fields.Html.parse('<p>Hello</p>')).toBe('<p>Hello</p>');
      expect(Fields.Monetary.parse('150.75')).toBe(150.75);
    });

    test('should parse and format Selection correctly', () => {
      expect(Fields.Selection.parse('draft')).toBe('draft');
      expect(Fields.Selection.format('done')).toBe('done');
    });

    test('should parse Date and Datetime correctly', () => {
      const mockDate = new Date('2026-07-26T12:00:00.000Z');
      expect(Fields.Date.parse(mockDate)).toBe('2026-07-26');
      expect(Fields.Date.parse('2026-07-26 12:00:00')).toBe('2026-07-26');

      expect(Fields.Datetime.parse(mockDate)).toBe('2026-07-26 12:00:00');
    });
  });

  describe('Relational Field Serializers', () => {
    test('should serialize Many2one values to standard raw ID or false', () => {
      // Odoo many2one is loaded either as standard tuple [id, name] or raw number
      expect(Fields.Many2one.serialize([5, 'YourCompany'])).toBe(5);
      expect(Fields.Many2one.serialize(12)).toBe(12);
      expect(Fields.Many2one.serialize(null)).toBe(false);
    });

    test('should serialize One2many relation commands correctly', () => {
      expect(Fields.One2many.replaceWith([1, 2])).toEqual([[6, 0, [1, 2]]]);
      expect(Fields.One2many.add({ name: 'Subtask' })).toEqual([[0, 0, { name: 'Subtask' }]]);
      expect(Fields.One2many.update(5, { name: 'New' })).toEqual([[1, 5, { name: 'New' }]]);
      expect(Fields.One2many.remove(10)).toEqual([[2, 10, 0]]);
    });

    test('should serialize Many2many relation commands correctly', () => {
      // Odoo command (6, 0, [ids]) replaces all relations
      const command = Fields.Many2many.replaceWith([10, 11, 12]);
      expect(command).toEqual([[6, 0, [10, 11, 12]]]);

      // Add command (4, id) links existing
      const linkCommand = Fields.Many2many.linkTo(15);
      expect(linkCommand).toEqual([[4, 15, 0]]);
    });
  });
});
