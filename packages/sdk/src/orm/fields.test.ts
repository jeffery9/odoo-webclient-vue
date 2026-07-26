import { describe, test, expect } from 'vitest';
import { Fields } from './fields.js';

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
  });

  describe('Relational Field Serializers', () => {
    test('should serialize Many2one values to standard raw ID or false', () => {
      // Odoo many2one is loaded either as standard tuple [id, name] or raw number
      expect(Fields.Many2one.serialize([5, 'YourCompany'])).toBe(5);
      expect(Fields.Many2one.serialize(12)).toBe(12);
      expect(Fields.Many2one.serialize(null)).toBe(false);
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
