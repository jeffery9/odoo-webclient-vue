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
