import { describe, test, expect } from 'vitest';
import { availableCompanies, activeCompany, switchCompany, loadCompaniesFromSession } from '../src/auth/company.js';
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

  test('should dynamically parse user_companies payload from authenticated session', () => {
    const mockSession = {
      companyId: 2,
      userCompanies: {
        '1': { id: 1, name: 'Brussels International' },
        '2': { id: 2, name: 'San Francisco HQ' }
      }
    };

    loadCompaniesFromSession(mockSession);
    expect(availableCompanies.value.length).toBe(2);
    expect(activeCompany.value.id).toBe(2);
    expect(activeCompany.value.name).toBe('San Francisco HQ');
  });
});
