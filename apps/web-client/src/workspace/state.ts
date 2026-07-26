import { ref, reactive, computed } from 'vue';
import { RecordProxy } from '@odoo/sdk';

export const partnerRecords = reactive<RecordProxy[]>([]);
export const activeAction = ref<any>(null);
export const activeContext = ref<Record<string, any>>({});
export const activeViewType = ref<'list' | 'kanban' | 'form'>('list');
export const selectedRecord = ref<RecordProxy | null>(null);
export const readonlyMode = ref(true);

export const currentOffset = ref(0);
export const currentLimit = ref(20);
export const totalRecordsCount = ref(0);
export const searchQuery = ref('');

export const listArch = ref<any>({ type: 'list', children: [] });
export const formArch = ref<any>({ type: 'form', children: [] });
export const kanbanArch = ref<any>({ type: 'kanban', children: [] });

export const filteredRecords = computed(() => {
  if (!searchQuery.value) return partnerRecords;
  const q = searchQuery.value.toLowerCase();
  return partnerRecords.filter(r => {
    const name = (r.get('name') || '').toLowerCase();
    const email = (r.get('email') || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });
});
