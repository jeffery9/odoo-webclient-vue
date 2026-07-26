import { createApp, h, onMounted } from 'vue';
import { RecordProxy, HashRouter, RPCClient } from '@odoo/sdk';
import { isOdooAddonMode } from './config.js';

// Domain imports
import {
  isAuthenticated,
  isConnecting,
  isDevMode,
  persistSettings,
  handleConnect,
  handleAddonAutoLogin,
  handleDisconnectCleanup,
} from './auth/state.js';
import { LoginPortal } from './auth/LoginPortal.js';

import {
  menus,
  activeMenu,
  activeMenuName,
} from './layout/state.js';
import { ControlPanel } from './layout/ControlPanel.js';

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
  searchQuery,
  listArch,
  formArch,
} from './workspace/state.js';
import {
  executeAction,
  handleCreate,
  saveChanges,
  discardChanges,
} from './workspace/actions.js';
import { MainWorkspace } from './workspace/MainWorkspace.js';

// Setup Router
const router = new HashRouter();

const App = {
  name: 'App',
  setup() {
    // Dynamic menu bootstrapping
    const bootstrapMenus = async (client: RPCClient) => {
      const [odooMenus] = await Promise.all([
        client.loadMenus(),
        client.loadTranslations('en_US'),
      ]);

      const rootMenu = odooMenus?.root || {};
      const parsedApps: any[] = [];

      if (rootMenu.children) {
        for (const mid of rootMenu.children) {
          const m = odooMenus[mid];
          if (m) {
            let actId = m.actionID || m.action_id || m.action;
            if (typeof actId === 'string') {
              const matched = actId.match(/\d+/);
              if (matched) actId = Number(matched[0]);
            }
            const subsections = m.children?.map((smid: number) => {
              const sub = odooMenus[smid];
              return {
                title: sub.name,
                items: sub.children?.map((subsubid: number) => {
                  const subsub = odooMenus[subsubid];
                  let subActId = subsub.actionID || subsub.action_id || subsub.action;
                  if (typeof subActId === 'string') {
                    const matched = subActId.match(/\d+/);
                    if (matched) subActId = Number(matched[0]);
                  }
                  return {
                    name: subsub.name,
                    actionID: subActId,
                  };
                }) || [],
              };
            }) || [];

            parsedApps.push({
              id: mid,
              name: m.name,
              actionID: actId,
              subsections,
            });
          }
        }
      }

      menus.value = parsedApps;
      if (parsedApps.length > 0) {
        await selectApp(parsedApps[0]);
      }
    };

    const handleConnectTrigger = async () => {
      await handleConnect(bootstrapMenus);
    };

    const handleDisconnect = () => {
      handleDisconnectCleanup(() => {
        menus.value = [];
        activeMenu.value = null;
        activeAction.value = null;
        partnerRecords.splice(0, partnerRecords.length);
      });
    };

    const selectApp = async (app: any) => {
      activeMenu.value = app;
      activeViewType.value = 'list';
      currentOffset.value = 0;

      const firstSectionItem = app.subsections?.[0]?.items?.[0];
      const actionToLoad = firstSectionItem ? firstSectionItem.actionID : app.actionID;
      activeMenuName.value = firstSectionItem ? firstSectionItem.name : app.name;

      if (actionToLoad) {
        await executeAction(actionToLoad, { resetOffset: true });
      }
    };

    const selectSubmenu = async (item: { name: string; actionID: number }) => {
      activeMenuName.value = item.name;
      activeViewType.value = 'list';
      await executeAction(item.actionID, { resetOffset: true });
    };

    const selectPartner = (rec: RecordProxy) => {
      selectedRecord.value = rec;
      activeViewType.value = 'form';
      readonlyMode.value = true;
      syncStateToHash();
    };

    const setViewType = (mode: 'list' | 'kanban' | 'form') => {
      activeViewType.value = mode;
      if (mode === 'list') {
        readonlyMode.value = true;
      }
      syncStateToHash();
    };

    const syncStateToHash = () => {
      const params: Record<string, string> = {
        menu_id: activeMenu.value?.id || '',
        action: activeAction.value?.id || '',
        view_type: activeViewType.value,
        offset: String(currentOffset.value),
        limit: String(currentLimit.value),
      };
      if (activeViewType.value === 'form' && selectedRecord.value) {
        params.id = String(selectedRecord.value.id || '');
      }
      router.setParams(params);
    };

    const handleHashNavigation = async (params: Record<string, string>) => {
      if (params.menu_id) {
        const menuId = Number(params.menu_id);
        const found = menus.value.find(m => m.id === menuId);
        if (found && found !== activeMenu.value) {
          activeMenu.value = found;
        }
      }
      if (params.offset) {
        currentOffset.value = Number(params.offset);
      }
      if (params.view_type) {
        activeViewType.value = params.view_type as any;
      }
      if (params.id && partnerRecords.length > 0) {
        const recordId = Number(params.id);
        const found = partnerRecords.find(r => r.id === recordId);
        if (found) {
          selectedRecord.value = found;
        }
      }
    };

    const handlePageNext = async () => {
      if (currentOffset.value + currentLimit.value < totalRecordsCount.value) {
        currentOffset.value += currentLimit.value;
        await executeAction(activeAction.value?.id || activeMenu.value.actionID);
      }
    };

    const handlePagePrev = async () => {
      if (currentOffset.value - currentLimit.value >= 0) {
        currentOffset.value -= currentLimit.value;
        await executeAction(activeAction.value?.id || activeMenu.value.actionID);
      }
    };

    onMounted(async () => {
      const initialParams = router.getParams();
      if (Object.keys(initialParams).length > 0) {
        await handleHashNavigation(initialParams);
      }
      router.onNavigate(handleHashNavigation);

      if (isOdooAddonMode()) {
        isDevMode.value = false;
        await handleAddonAutoLogin(bootstrapMenus);
      }
    });

    return () => h('div', { style: 'height: 100%; display: flex; flex-direction: column;' }, [
      // Navbar Component
      h('header', { class: 'o_main_navbar' }, [
        h('div', { class: 'o_navbar_left' }, [
          h('div', { class: 'o_menu_brand' }, '☰ Apps'),
          isAuthenticated.value ? h('nav', { class: 'o_navbar_apps' }, 
            menus.value.map(m => h('a', {
              class: ['o_nav_link', activeMenu.value?.id === m.id ? 'active' : ''],
              onClick: () => selectApp(m)
            }, m.name))
          ) : null
        ]),
        h('div', { class: 'o_navbar_right' }, [
          isAuthenticated.value
            ? h('button', { class: 'o_connect_btn connected', onClick: handleDisconnect }, '🟢 Connected')
            : null,
          isAuthenticated.value ? h('span', { style: 'font-weight: 500; margin-left: 10px;' }, 'Administrator') : null,
          isAuthenticated.value ? h('div', { class: 'o_user_avatar' }, 'A') : null
        ])
      ]),

      // Login Portal
      !isAuthenticated.value ? h(LoginPortal, { onConnect: handleConnectTrigger }) : null,

      // Main Content Area
      isAuthenticated.value ? h('div', { style: 'flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;' }, [
        // Control Panel
        h(ControlPanel, {
          activeViewType: activeViewType.value,
          selectedRecord: selectedRecord.value,
          readonlyMode: readonlyMode.value,
          searchQuery: searchQuery.value,
          currentOffset: currentOffset.value,
          currentLimit: currentLimit.value,
          totalRecordsCount: totalRecordsCount.value,
          onPageNext: handlePageNext,
          onPagePrev: handlePagePrev,
          onSearchInput: (val: string) => { searchQuery.value = val; },
          onCreate: handleCreate,
          onToggleEdit: () => { readonlyMode.value = !readonlyMode.value; },
          onSaveChanges: saveChanges,
          onDiscardChanges: discardChanges,
          onBackToList: () => { activeViewType.value = 'list'; readonlyMode.value = true; },
          onSetViewType: setViewType,
        }),

        // Workspace Render Grid
        h(MainWorkspace, {
          onSelectRecord: (rec: any) => {
            if (rec.actionID) {
              selectSubmenu(rec);
            } else {
              selectPartner(rec);
            }
          }
        })
      ]) : null
    ]);
  }
};

createApp(App).mount('#app');
