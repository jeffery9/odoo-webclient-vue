import { describe, it, expect, vi } from 'vitest';
import { useOdooField } from '../../src/composables/useOdooField.js';

describe('useOdooField Composable', () => {
    it('should correctly bind values and evaluate modifiers dynamically', () => {
        const mockRecord = {
            get: vi.fn(() => 'Test Value'),
            set: vi.fn(),
            isReadonly: vi.fn(() => false),
            isRequired: vi.fn(() => true),
            isInvisible: vi.fn(() => false),
            errors: { char_field: [] },
            isDirty: vi.fn(() => false),
            model: { fields: { char_field: { string: 'Char Field Label' } } }
        } as any;

        const props = { record: mockRecord, name: 'char_field' };
        const { value, isReadonly, isRequired, isInvisible, label } = useOdooField(props);

        expect(value.value).toBe('Test Value');
        expect(isReadonly.value).toBe(false);
        expect(isRequired.value).toBe(true);
        expect(isInvisible.value).toBe(false);
        expect(label.value).toBe('Char Field Label');

        value.value = 'New Value';
        expect(mockRecord.set).toHaveBeenCalledWith('char_field', 'New Value');
    });
});
