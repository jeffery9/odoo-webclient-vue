import { RecordProxy, ArchCompiler, Context } from '@odoo/sdk';
import { activeClient, isConnecting } from '../auth/state.js';
import {
  partnerRecords,
  activeAction,
  activeContext,
  activeViewType,
  selectedRecord,
  readonlyMode,
  currentOffset,
  currentLimit,
  totalRecordsCount,
  listArch,
  formArch,
  kanbanArch,
  searchArch,
  searchPanelDomain
} from './state.js';

export const executeAction = async (actionId: number, options?: { resetOffset?: boolean }) => {
  if (!activeClient.value) return;
  isConnecting.value = true;
  if (options?.resetOffset) {
    currentOffset.value = 0;
  }

  try {
    const action = await activeClient.value.loadAction(actionId);
    if (!action || !action.res_model) {
      throw new Error(`Odoo action ${actionId} specifies no valid model.`);
    }
    const model = action.res_model;

    const evaluatedContext = Context.merge(
      [action.context],
      { uid: (activeClient.value as any).uid || 1 }
    );
    activeContext.value = evaluatedContext;

    // Load search view alongside regular views to extract search panels
    const viewsToLoad: [number | boolean, string][] = [
      ...(action.views || [[false, 'list'], [false, 'form'], [false, 'kanban']]),
      [false, 'search']
    ];
    const viewsResponse = await activeClient.value.loadViews(model, viewsToLoad);
    const viewsMap = viewsResponse?.fields_views || {};

    const rawListXml = viewsMap.list?.arch || viewsMap.tree?.arch || '';
    const rawFormXml = viewsMap.form?.arch || '';
    const rawKanbanXml = viewsMap.kanban?.arch || '';
    const rawSearchXml = viewsMap.search?.arch || '';

    // Merge search panel domain filters with base action domain
    const domain = [...(action.domain || []), ...searchPanelDomain.value];
    totalRecordsCount.value = await activeClient.value.call(model, 'search_count', [domain], { context: activeContext.value });

    const fieldsToSelect: string[] = ['name', 'active', 'category_id', 'user_id'];
    const recordsData = await activeClient.value.search_read(
      model,
      domain,
      fieldsToSelect,
      currentLimit.value,
      currentOffset.value,
      activeContext.value
    );

    activeAction.value = action;

    if (rawListXml) listArch.value = ArchCompiler.compile(rawListXml);
    if (rawFormXml) formArch.value = ArchCompiler.compile(rawFormXml);
    if (rawKanbanXml) kanbanArch.value = ArchCompiler.compile(rawKanbanXml);
    if (rawSearchXml) searchArch.value = ArchCompiler.compile(rawSearchXml);

    const proxies = recordsData.map((d: any) => new RecordProxy(model, d, activeClient.value!));
    partnerRecords.splice(0, partnerRecords.length, ...proxies);
    selectedRecord.value = partnerRecords[0] || null;
  } catch (err: any) {
    alert('Odoo Dynamic Loader Error: ' + err.message);
  } finally {
    isConnecting.value = false;
  }
};

export const handleCreate = () => {
  const model = activeAction.value?.res_model || 'res.partner';
  const defaultValues: Record<string, any> = {};
  if (activeContext.value) {
    for (const [key, value] of Object.entries(activeContext.value)) {
      if (key.startsWith('default_')) {
        const fieldName = key.substring(8);
        defaultValues[fieldName] = value;
      }
    }
  }

  if (activeClient.value) {
    selectedRecord.value = new RecordProxy(
      model,
      { id: null, name: 'New Record', ...defaultValues },
      activeClient.value
    );
  }
  activeViewType.value = 'form';
  readonlyMode.value = false;
};

export const saveChanges = async () => {
  try {
    if (selectedRecord.value) {
      const isNew = selectedRecord.value.id === null;
      await selectedRecord.value.save(activeContext.value);
      if (isNew) {
        partnerRecords.push(selectedRecord.value);
      }
    }
    readonlyMode.value = true;
  } catch (err: any) {
    alert('Odoo Backend Save Error: ' + err.message);
  }
};

export const discardChanges = () => {
  if (selectedRecord.value) {
    selectedRecord.value.discard();
  }
  readonlyMode.value = true;
};
