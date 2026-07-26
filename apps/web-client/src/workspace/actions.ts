import { RecordProxy, ArchCompiler, Context } from '@odoo/sdk';
import { activeClient, isConnecting } from '../auth/state.js';
import { addNotification } from '../layout/notification.js';
import { activeCompany } from '../auth/company.js';
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
  searchPanelDomain,
  viewArchs,
  OdooViewType
} from './state.js';

const resolveSafeDomain = async (
  model: string,
  domain: any[],
  client: any,
  context: any
): Promise<any[]> => {
  const fieldCompareTuples: any[] = [];
  const standardDomain: any[] = [];

  domain.forEach((term) => {
    if (Array.isArray(term)) {
      const [field, op, val] = term;
      if (typeof val === 'string' && val.startsWith('$field:')) {
        fieldCompareTuples.push(term);
      } else {
        standardDomain.push(term);
      }
    } else {
      standardDomain.push(term);
    }
  });

  if (fieldCompareTuples.length === 0) {
    return domain;
  }

  const involvedFields = new Set<string>(['id']);
  fieldCompareTuples.forEach(([field, op, val]) => {
    involvedFields.add(field);
    involvedFields.add(val.substring(7));
  });

  try {
    const rawRecords = await client.search_read(
      model,
      standardDomain,
      Array.from(involvedFields),
      undefined,
      undefined,
      context
    );

    const matchedIds = rawRecords
      .filter((rec: any) => {
        return fieldCompareTuples.every(([field, op, val]) => {
          const recordVal = rec[field];
          const compareField = val.substring(7);
          const compareVal = rec[compareField];

          switch (op) {
            case '=': return recordVal === compareVal;
            case '!=': return recordVal !== compareVal;
            case '>': return recordVal > compareVal;
            case '>=': return recordVal >= compareVal;
            case '<': return recordVal < compareVal;
            case '<=': return recordVal <= compareVal;
            default: return recordVal === compareVal;
          }
        });
      })
      .map((r: any) => r.id);

    if (matchedIds.length === 0) {
      return [['id', '=', 0]];
    }

    return [['id', 'in', matchedIds]];
  } catch (e) {
    return standardDomain;
  }
};

export const executeAction = async (actionId: number, options?: { resetOffset?: boolean }) => {
  if (!activeClient.value) return;
  isConnecting.value = true;
  if (options?.resetOffset) {
    currentOffset.value = 0;
  }

  try {
    const action = await activeClient.value.loadAction(actionId);
    if (!action) {
      throw new Error(`Odoo action ${actionId} could not be loaded.`);
    }

    activeAction.value = action;

    const evaluatedContext = Context.merge(
      [action.context || {}],
      { uid: (activeClient.value as any).uid || 1 }
    );
    activeContext.value = {
      ...evaluatedContext,
      company_id: activeCompany.value.id,
      allowed_company_ids: [activeCompany.value.id]
    };

    if (action.type === 'ir.actions.client' || action.type === 'ir.actions.report') {
      isConnecting.value = false;
      return;
    }

    const defaultView = resolveDefaultViewType(action);
    activeViewType.value = defaultView;

    if (!action.res_model) {
      throw new Error(`Odoo action ${actionId} specifies no valid model.`);
    }
    const model = action.res_model;

    // Load all views declared in action dynamically, along with the search view
    const viewModes = action.view_mode ? action.view_mode.split(',').map((m: string) => m.trim()) : ['list', 'form', 'kanban'];
    const viewsToLoad: [number | boolean, string][] = viewModes.map((m: string) => [false, m === 'list' ? 'tree' : m]);
    viewsToLoad.push([false, 'search']);

    const viewsResponse = await activeClient.value.loadViews(model, viewsToLoad);
    const viewsMap = viewsResponse?.fields_views || {};

    // Merge search panel domain filters with base action domain
    const rawDomain = [...(action.domain || []), ...searchPanelDomain.value];
    const domain = await resolveSafeDomain(model, rawDomain, activeClient.value, activeContext.value);

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

    // Dynamic compilation of all loaded views
    viewArchs.value = {};
    for (const [vType, vData] of Object.entries(viewsMap)) {
      const xmlArch = (vData as any)?.arch || '';
      if (xmlArch) {
        const targetType = vType === 'tree' ? 'list' : vType;
        const compiled = ArchCompiler.compile(xmlArch);
        if (targetType === 'search') {
          searchArch.value = compiled;
        } else {
          viewArchs.value[targetType] = compiled;
        }
      }
    }

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

  addNotification('Pre-populated new record template with contextual defaults.', 'info');
};

export const saveChanges = async () => {
  try {
    if (selectedRecord.value) {
      const isNew = selectedRecord.value.id === null;
      await selectedRecord.value.save(activeContext.value);
      if (isNew) {
        partnerRecords.push(selectedRecord.value);
      }
      
      const recordName = selectedRecord.value.get('name') || selectedRecord.value.get('display_name') || 'New Record';
      addNotification(`Successfully saved record "${recordName}" to Odoo backend.`, 'success');
    }
    readonlyMode.value = true;
  } catch (err: any) {
    addNotification(`Odoo Backend Save Error: ${err.message}`, 'error');
    alert('Odoo Backend Save Error: ' + err.message);
  }
};

export const discardChanges = () => {
  if (selectedRecord.value) {
    selectedRecord.value.discard();
  }
  readonlyMode.value = true;
};

export const resolveDefaultViewType = (action: any): OdooViewType => {
  if (!action) return 'list';

  // Support comma-separated view_mode (e.g., 'kanban,tree,form')
  if (action.view_mode && typeof action.view_mode === 'string') {
    const modes = action.view_mode.split(',').map((m: string) => m.trim());
    for (const m of modes) {
      if (m === 'tree' || m === 'list') return 'list';
      return m as OdooViewType;
    }
  }

  // Fallback to views array list if available
  if (Array.isArray(action.views) && action.views.length > 0) {
    const firstType = action.views[0][1];
    return firstType === 'tree' ? 'list' : (firstType as OdooViewType);
  }

  return 'list';
};
