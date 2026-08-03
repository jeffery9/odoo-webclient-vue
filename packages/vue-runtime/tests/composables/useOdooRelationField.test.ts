import { describe, it, expect, vi } from 'vitest';
import { useOdooRelationField } from '../../src/composables/useOdooRelationField.js';

describe('useOdooRelationField Composable', () => {
    it('performs debounced asynchronous name_search', async () => {
        vi.useFakeTimers();
        const mockCall = vi.fn(() => Promise.resolve([[1, 'Partner 1']]));
        const mockRecord = {
            get: vi.fn(() => [1, 'Partner 1']),
            set: vi.fn(),
            isReadonly: vi.fn(() => false),
            isRequired: vi.fn(() => false),
            isInvisible: vi.fn(() => false),
            evalContextWith: vi.fn(() => ({})),
            evalDomainOf: vi.fn(() => []),
            errors: {},
            model: {
                fields: { partner_id: { relation: 'res.partner', string: 'Partner' } },
                sdk: { rpc: { call: mockCall } }
            }
        } as any;

        const props = { record: mockRecord, name: 'partner_id' };
        const { search, suggestions, isLoading } = useOdooRelationField(props);

        search('Query');
        expect(isLoading.value).toBe(true);

        // Fast-forward debounce timer
        vi.advanceTimersByTime(250);

        await Promise.resolve(); // flush async microtasks
        expect(mockCall).toHaveBeenCalledWith('name_search', expect.objectContaining({
            model: 'res.partner',
            name: 'Query'
        }));
        expect(suggestions.value).toEqual([{ id: 1, display_name: 'Partner 1' }]);
        vi.useRealTimers();
    });
});
