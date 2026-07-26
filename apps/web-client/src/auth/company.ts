import { ref } from 'vue';
import { addNotification } from '../layout/notification.js';

export interface Company {
  id: number;
  name: string;
}

// Initial fallbacks before authentication
export const availableCompanies = ref<Company[]>([
  { id: 1, name: 'San Francisco HQ' },
  { id: 2, name: 'Chicago Branch' },
  { id: 3, name: 'Brussels International' }
]);

export const activeCompany = ref<Company>({ id: 1, name: 'San Francisco HQ' });

export const switchCompany = (companyId: number) => {
  const found = availableCompanies.value.find(c => c.id === companyId);
  if (found) {
    activeCompany.value = found;
    addNotification(`Switched active context to company: ${found.name}`, 'success');
  }
};

export const loadCompaniesFromSession = (session: any) => {
  if (!session) return;
  const allowed = session.userCompanies || {};
  const parsedCompanies: Company[] = [];

  if (allowed && typeof allowed === 'object') {
    for (const [key, value] of Object.entries(allowed)) {
      if (value && typeof value === 'object' && 'id' in value) {
        parsedCompanies.push({
          id: (value as any).id,
          name: (value as any).name || (value as any).display_name || `Company ${key}`
        });
      } else {
        parsedCompanies.push({
          id: Number(key),
          name: String(value)
        });
      }
    }
  }

  if (parsedCompanies.length > 0) {
    availableCompanies.value = parsedCompanies;
    const activeId = session.companyId;
    const active = parsedCompanies.find(c => c.id === activeId) || parsedCompanies[0];
    activeCompany.value = active;
  }
};
