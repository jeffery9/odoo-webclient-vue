import { describe, test, expect } from 'vitest';
import { ArchCompiler } from './compiler.js';
describe('Odoo XML Arch & QWeb Compiler', () => {
    test('should compile basic Odoo view XML with nested elements and modifiers', () => {
        const xml = `
      <form string="Partner">
          <group>
              <field name="name" required="1"/>
              <field name="email" widget="email" attrs="{'readonly': [('state', '=', 'done')]}"/>
          </group>
          <button name="action_confirm" type="object" string="Confirm"/>
      </form>
    `;
        const compiled = ArchCompiler.compile(xml);
        expect(compiled.tag).toBe('form');
        expect(compiled.attrs.string).toBe('Partner');
        // Group children
        const group = compiled.children?.[0];
        expect(group?.tag).toBe('group');
        // Field 1: name
        const fieldName = group?.children?.[0];
        expect(fieldName?.tag).toBe('field');
        expect(fieldName?.attrs.name).toBe('name');
        expect(fieldName?.modifiers?.required).toBe(true);
        // Field 2: email
        const fieldEmail = group?.children?.[1];
        expect(fieldEmail?.tag).toBe('field');
        expect(fieldEmail?.attrs.name).toBe('email');
        expect(fieldEmail?.attrs.widget).toBe('email');
        // modifiers.readonly is compiled from attrs
        expect(fieldEmail?.modifiers?.readonly).toEqual(['state', '=', 'done']);
        // Button: action_confirm
        const button = compiled.children?.[1];
        expect(button?.tag).toBe('button');
        expect(button?.attrs.name).toBe('action_confirm');
        expect(button?.attrs.type).toBe('object');
    });
    test('should compile QWeb conditionals and directives natively', () => {
        const xml = `
      <form>
          <field name="name"/>
          <t t-if="state == 'done'">
              <field name="date_done"/>
          </t>
      </form>
    `;
        const compiled = ArchCompiler.compile(xml);
        expect(compiled.tag).toBe('form');
        expect(compiled.children?.[0].tag).toBe('field');
        const qwebIf = compiled.children?.[1];
        expect(qwebIf?.tag).toBe('t');
        expect(qwebIf?.type).toBe('if');
        expect(qwebIf?.expr).toBe("state == 'done'");
        expect(qwebIf?.children?.[0].tag).toBe('field');
        expect(qwebIf?.children?.[0].attrs.name).toBe('date_done');
    });
});
//# sourceMappingURL=compiler.test.js.map