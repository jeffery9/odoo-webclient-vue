import { describe, test, expect } from 'vitest';
import { Modifier } from './modifier.js';
describe('Odoo Modifier DSL Compiler', () => {
    const recordActive = { state: 'done', user_id: 1 };
    const recordDraft = { state: 'draft', user_id: 2 };
    test('should compile and evaluate attrs dictionary rules', () => {
        const spec = {
            attrs: "{'readonly': [('state', '=', 'done')], 'invisible': [('user_id', '=', 2)]}"
        };
        const compiled = Modifier.compile(spec);
        const activeEval = Modifier.evaluate(compiled, recordActive, {});
        expect(activeEval.readonly).toBe(true);
        expect(activeEval.invisible).toBe(false);
        const draftEval = Modifier.evaluate(compiled, recordDraft, {});
        expect(draftEval.readonly).toBe(false);
        expect(draftEval.invisible).toBe(true);
    });
    test('should handle static invisible/readonly/required shortcut attributes', () => {
        const spec = {
            readonly: '1',
            invisible: 'true',
            required: true
        };
        const compiled = Modifier.compile(spec);
        const result = Modifier.evaluate(compiled, recordActive, {});
        expect(result.readonly).toBe(true);
        expect(result.invisible).toBe(true);
        expect(result.required).toBe(true);
    });
    test('should compile states attributes into standard invisible conditions', () => {
        const spec = {
            states: 'draft,sent'
        };
        const compiled = Modifier.compile(spec);
        // If states="draft,sent", it should be visible in draft, sent, and invisible in other states like 'done'.
        const draftEval = Modifier.evaluate(compiled, recordDraft, {});
        expect(draftEval.invisible).toBe(false);
        const activeEval = Modifier.evaluate(compiled, recordActive, {});
        expect(activeEval.invisible).toBe(true);
    });
});
//# sourceMappingURL=modifier.test.js.map