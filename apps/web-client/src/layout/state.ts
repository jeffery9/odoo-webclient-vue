import { ref } from 'vue';

export const menus = ref<any[]>([]);
export const activeMenu = ref<any>(null);
export const activeMenuName = ref('');
export const showAppSwitcher = ref(false);
