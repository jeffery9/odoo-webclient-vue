# Navbar Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive, reactive Odoo-style notification system in the top navbar with real-time operational feeds.

**Architecture:** Create a cohesive layout sub-module `notification.ts` that manages the reactive notification stream, integrated dynamically with navbar UI controllers and business action signals.

**Tech Stack:** TypeScript, Vue 3 reactivity & runtime h-functions.

## Global Constraints
* Separate test suites and production files completely: tests go to `apps/web-client/tests/`.
* No hardcoded mockup data in production code; all real-time events must be dynamically spawned based on backend operations.
* Zero external `.vue` SFC files; use pure TS with standard `h()` functions.

---

### Task 1: Scaffolding Reactive Notification State Service

**Files:**
* Create: `apps/web-client/src/layout/notification.ts`

**Interfaces:**
* Produces: `notifications` (reactive ref), `unreadCount` (computed), `addNotification(msg, type)`, `markAllAsRead()`, `clearAll()`

- [ ] **Step 1.1: Create notification module**

Write `apps/web-client/src/layout/notification.ts`:
```typescript
import { ref, computed } from 'vue';

export interface NotificationItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
}

const notificationSeq = ref(1);
export const notifications = ref<NotificationItem[]>([]);

export const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

export const addNotification = (message: string, type: NotificationItem['type'] = 'info') => {
  const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  notifications.value.unshift({
    id: notificationSeq.value++,
    message,
    type,
    date: dateStr,
    read: false
  });
};

export const markAllAsRead = () => {
  notifications.value.forEach(n => { n.read = true; });
};

export const clearAll = () => {
  notifications.value = [];
};
```

---

### Task 2: Adding Operational Feeds during Database Business Events

**Files:**
* Modify: `apps/web-client/src/auth/state.ts`
* Modify: `apps/web-client/src/workspace/actions.ts`

- [ ] **Step 2.1: Instrument Authenticator State Alerts**

Inject success/error alerts into `apps/web-client/src/auth/state.ts` so login transitions are logged:
```typescript
// Add imports
import { addNotification } from '../layout/notification.js';

// Inside handleConnect
addNotification(`Successfully authenticated session with Odoo database: ${dbName.value}`, 'success');

// Inside handleDisconnectCleanup
addNotification('User Administrator logged out of Odoo session.', 'info');
```

- [ ] **Step 2.2: Instrument ORM Save and Error Alerts**

Inject notifications into `apps/web-client/src/workspace/actions.ts` during record lifecycle events:
```typescript
// Add imports
import { addNotification } from '../layout/notification.js';

// Inside saveChanges success
addNotification(`Successfully saved record "${selectedRecord.value?.get('name') || 'New'}" to Odoo backend.`, 'success');

// Inside handleCreate
addNotification('Pre-populated new record template with contextual defaults.', 'info');
```

---

### Task 3: Integrating Notification UI inside Top Navbar

**Files:**
* Modify: `apps/web-client/src/main.ts`
* Modify: `apps/web-client/index.html`

- [ ] **Step 3.1: Add dropdown and badge styles**

Add CSS styles inside `<style>` of `apps/web-client/index.html`:
```css
      /* Navbar Notification Container */
      .o_navbar_notifications {
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 6px;
        border-radius: 4px;
        transition: background-color 0.1s ease;
      }
      .o_navbar_notifications:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
      .o_notification_badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background-color: #dc2626; /* Odoo alert red */
        color: white;
        font-size: 10px;
        font-weight: bold;
        border-radius: 10px;
        padding: 1px 5px;
        min-width: 10px;
        text-align: center;
        line-height: 1.2;
      }

      /* Notification Dropdown Panel */
      .o_notification_dropdown {
        position: absolute;
        top: 40px;
        right: 0;
        width: 280px;
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 600;
        color: #212529;
        display: flex;
        flex-direction: column;
        max-height: 360px;
      }
      .o_notification_header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid #dee2e6;
        font-size: 12px;
        font-weight: bold;
        background-color: #f8f9fa;
        color: #495057;
      }
      .o_notification_clear_btn {
        background: transparent;
        border: none;
        color: #714B67;
        cursor: pointer;
        font-size: 11px;
      }
      .o_notification_clear_btn:hover {
        text-decoration: underline;
      }
      .o_notification_list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex-grow: 1;
      }
      .o_notification_item {
        padding: 10px 12px;
        border-bottom: 1px solid #f1f2f4;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
      }
      .o_notification_item:hover {
        background-color: #f8f9fa;
      }
      .o_notification_item.unread {
        background-color: #f0fdf4; /* Very light green tint for unread success/info */
        font-weight: 500;
      }
      .o_notification_item_top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .o_notification_time {
        font-size: 10px;
        color: #94a3b8;
      }
      .o_notification_empty {
        padding: 24px;
        text-align: center;
        color: #94a3b8;
        font-size: 12px;
      }
```

- [ ] **Step 3.2: Render Toggle Control inside `main.ts`**

Update the header section in `apps/web-client/src/main.ts` to include the bell icon, badge, and toggled dropdown panel:
```typescript
import {
  notifications,
  unreadCount,
  markAllAsRead,
  clearAll,
} from './layout/notification.js';

// Inside App.setup()
const showNotifications = ref(false);

// Inside App returned rendering tree
h('div', { class: 'o_navbar_right' }, [
  isAuthenticated.value ? h('div', {
    class: 'o_navbar_notifications',
    onClick: () => {
      showNotifications.value = !showNotifications.value;
      if (showNotifications.value) markAllAsRead();
    }
  }, [
    h('span', { style: 'font-size: 18px;' }, '🔔'),
    unreadCount.value > 0 ? h('span', { class: 'o_notification_badge' }, unreadCount.value) : null,
    
    // Dropdown list panel
    showNotifications.value ? h('div', { class: 'o_notification_dropdown', onClick: (e: any) => e.stopPropagation() }, [
      h('div', { class: 'o_notification_header' }, [
        h('span', null, `Notifications (${notifications.value.length})`),
        h('button', { class: 'o_notification_clear_btn', onClick: () => { clearAll(); showNotifications.value = false; } }, 'Clear All')
      ]),
      h('ul', { class: 'o_notification_list' }, 
        notifications.value.length === 0 
          ? [h('div', { class: 'o_notification_empty' }, 'No new activities.')]
          : notifications.value.map(n => h('li', { class: ['o_notification_item', n.read ? '' : 'unread'] }, [
              h('div', { class: 'o_notification_item_top' }, [
                h('span', { style: n.type === 'success' ? 'color: #16a34a; font-weight: bold;' : 'color: #0284c7; font-weight: bold;' }, n.type.toUpperCase()),
                h('span', { class: 'o_notification_time' }, n.date)
              ]),
              h('div', { style: 'margin-top: 4px; line-height: 1.4;' }, n.message)
            ]))
      )
    ]) : null
  ]) : null,
  // rest of existing navbar items ...
])
```

---

### Task 4: Verification & Automated Tests

**Files:**
* Create: `apps/web-client/tests/notification.test.ts`

- [ ] **Step 4.1: Write notifications unit test**

Create `apps/web-client/tests/notification.test.ts` to verify operational notification streams:
```typescript
import { describe, test, expect } from 'vitest';
import { notifications, unreadCount, addNotification, markAllAsRead, clearAll } from '../src/layout/notification.js';

describe('Odoo Navbar Notification Service', () => {
  test('should trigger reactive unread counts on operational events', () => {
    clearAll();
    expect(notifications.value.length).toBe(0);
    expect(unreadCount.value).toBe(0);

    addNotification('Connection established successfully.', 'success');
    expect(notifications.value.length).toBe(1);
    expect(unreadCount.value).toBe(1);
    expect(notifications.value[0].message).toBe('Connection established successfully.');
    expect(notifications.value[0].type).toBe('success');
    expect(notifications.value[0].read).toBe(false);

    markAllAsRead();
    expect(unreadCount.value).toBe(0);
    expect(notifications.value[0].read).toBe(true);

    clearAll();
    expect(notifications.value.length).toBe(0);
  });
});
```

- [ ] **Step 4.2: Build and verify**

Run: `npm run build`  
Run: `npx vitest run`  
Expected: All 76 assertions pass green!
