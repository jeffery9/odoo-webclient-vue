import { ref } from 'vue';
import { addNotification } from '../layout/notification.js';

export interface Company {
  id: number;
  name: string;
}

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
