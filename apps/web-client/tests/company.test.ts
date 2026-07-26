import { describe, test, expect } from 'vitest';
import { availableCompanies, activeCompany, switchCompany } from '../src/auth/company.js';
import { notifications, clearAll } from '../src/layout/notification.js';

describe('Odoo Multi-Company Switcher Service', () => {
  test('should support context company swapping with dynamic feeds', () => {
    clearAll();
    expect(activeCompany.value.id).toBe(1);

    switchCompany(2);
    expect(activeCompany.value.id).toBe(2);
    expect(activeCompany.value.name).toBe('Chicago Branch');

    expect(notifications.value.length).toBe(1);
    expect(notifications.value[0].message).toContain('Switched active context to company: Chicago Branch');

    switchCompany(999); // Invalid should not switch
    expect(activeCompany.value.id).toBe(2);
  });
});
