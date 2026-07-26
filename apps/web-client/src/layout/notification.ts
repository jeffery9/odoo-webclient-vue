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
