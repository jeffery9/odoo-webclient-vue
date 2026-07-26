import { ref, reactive, computed } from 'vue';
import { RecordProxy } from '@odoo/sdk';

export type OdooViewType =
  | 'list'
  | 'kanban'
  | 'form'
  | 'search'
  | 'graph'
  | 'pivot'
  | 'calendar'
  | 'gantt'
  | 'cohort'
  | 'map'
  | 'activity'
  | 'hierarchy'
  | 'grid'
  | 'qweb';

export const partnerRecords = reactive<RecordProxy[]>([]);
export const activeAction = ref<any>(null);
export const activeContext = ref<Record<string, any>>({});
export const activeViewType = ref<OdooViewType>('list');
export const selectedRecord = ref<RecordProxy | null>(null);
export const readonlyMode = ref(true);

export const currentOffset = ref(0);
export const currentLimit = ref(20);
export const totalRecordsCount = ref(0);
export const searchQuery = ref('');

// Dynamic metadata-driven arch store for all standard Odoo view types
export const viewArchs = ref<Record<string, any>>({});
export const activeModelFields = ref<Record<string, any>>({});

export const listArch = computed(() => viewArchs.value.list || { type: 'list', children: [] });
export const formArch = computed(() => viewArchs.value.form || { type: 'form', children: [] });
export const kanbanArch = computed(() => viewArchs.value.kanban || { type: 'kanban', children: [] });
export const searchArch = ref<any>({ type: 'search', children: [] });
export const searchPanelDomain = ref<any[]>([]);

export const filteredRecords = computed(() => {
  if (!searchQuery.value) return partnerRecords;
  const q = searchQuery.value.toLowerCase();
  return partnerRecords.filter(r => {
    const name = (r.get('name') || '').toLowerCase();
    const email = (r.get('email') || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });
});
