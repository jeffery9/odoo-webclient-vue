# Company Switcher, User Profile Menu, and Developer Debug Menu Plan

**Goal:** Implement an Odoo-style multi-company switcher, an interactive User Profile dropdown, and a Developer Debug Menu in the top navbar.

---

### Task 1: Scaffolding Reactive Multi-Company State Service

**Files:**
* Create: `apps/web-client/src/auth/company.ts`

**Interfaces:**
* Produces: `availableCompanies` (ref), `activeCompany` (ref), `switchCompany(id)`

- [ ] **Step 1.1: Create company state module**

Write `apps/web-client/src/auth/company.ts`:
```typescript
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
```

---

### Task 2: Adding Multi-Company Context to Odoo Action RPC Requests

**Files:**
* Modify: `apps/web-client/src/workspace/actions.ts`

- [ ] **Step 2.1: Bind active company context parameters**

Update `executeAction` inside `apps/web-client/src/workspace/actions.ts` to automatically inject active company IDs into `activeContext.value`:
```typescript
// Add imports
import { activeCompany } from '../auth/company.js';

// Inside executeAction before database requests:
activeContext.value = {
  ...activeContext.value,
  company_id: activeCompany.value.id,
  allowed_company_ids: [activeCompany.value.id]
};
```

---

### Task 3: Integrating Dropdown CSS and Layout Markup

**Files:**
* Modify: `apps/web-client/index.html`
* Modify: `apps/web-client/src/main.ts`

- [ ] **Step 3.1: Add CSS layouts inside `index.html`**

Add CSS styles for company switcher, profile menus, and developer bug menu inside `index.html`:
```css
      /* Company Switcher Widget */
      .o_company_switcher {
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 6px 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        gap: 6px;
        transition: background-color 0.1s ease;
      }
      .o_company_switcher:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      .o_company_dropdown {
        position: absolute;
        top: 36px;
        left: 0;
        width: 180px;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 600;
        color: #212529;
        list-style: none;
        padding: 4px 0;
        margin: 0;
      }
      .o_company_item {
        padding: 8px 12px;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.1s ease;
      }
      .o_company_item:hover {
        background-color: #f8f9fa;
      }
      .o_company_item.active {
        font-weight: bold;
        color: #714B67;
        background-color: #f1f2f4;
      }

      /* Developer Debug Menu Widget */
      .o_developer_menu_container {
        position: relative;
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        transition: background-color 0.1s ease;
      }
      .o_developer_menu_container:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
      .o_dev_dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        width: 240px;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 600;
        color: #212529;
        list-style: none;
        padding: 4px 0;
        margin: 0;
      }
      .o_dev_header {
        padding: 6px 12px;
        font-size: 11px;
        font-weight: bold;
        color: #714B67;
        text-transform: uppercase;
        border-bottom: 1px solid #dee2e6;
        background-color: #f8f9fa;
      }
      .o_dev_item {
        padding: 8px 12px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #495057;
        transition: background-color 0.1s ease;
      }
      .o_dev_item:hover {
        background-color: #f8f9fa;
        color: #212529;
      }

      /* User Profile Dropdown Widget */
      .o_user_profile_container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.1s ease;
      }
      .o_user_profile_container:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
      .o_profile_dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        width: 160px;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 600;
        color: #212529;
        list-style: none;
        padding: 4px 0;
        margin: 0;
      }
      .o_profile_item {
        padding: 10px 14px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #495057;
        text-decoration: none;
        transition: background-color 0.1s ease;
      }
      .o_profile_item:hover {
        background-color: #f8f9fa;
        color: #212529;
      }
      .o_profile_item.logout {
        border-top: 1px solid #dee2e6;
        color: #dc2626;
      }
      .o_profile_item.logout:hover {
        background-color: #fef2f2;
      }
```

- [ ] **Step 3.2: Render Switchers, Profile Dropdown, and Debug Menu in `main.ts`**

Update `apps/web-client/src/main.ts` with state declarations and navbar elements:
```typescript
import {
  availableCompanies,
  activeCompany,
  switchCompany
} from './auth/company.js';
```

---

### Task 4: Verification & Automated Tests

**Files:**
* Create: `apps/web-client/tests/company.test.ts`

- [ ] **Step 4.1: Write company switching unit tests**

- [ ] **Step 4.2: Verify build and green vitest runs**
