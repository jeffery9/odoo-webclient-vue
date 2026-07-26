import { createApp, h, onMounted, ref } from 'vue';
import { RecordProxy, HashRouter, RPCClient } from '@odoo/sdk';
import { isOdooAddonMode } from './config.js';

import {
  notifications,
  unreadCount,
  markAllAsRead,
  clearAll,
  addNotification,
} from './layout/notification.js';

import {
  availableCompanies,
  activeCompany,
  switchCompany,
} from './auth/company.js';

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
  resolveDefaultViewType,
} from './workspace/actions.js';
import { MainWorkspace } from './workspace/MainWorkspace.js';
import { registerCoreComponents, componentRegistry } from '@odoo/vue-runtime';
import { FieldCommunityDate } from './widgets/FieldCommunityDate.js';

// Setup Router
const router = new HashRouter();

// Register all core Odoo Vue field widgets
registerCoreComponents();

// Override default date widget with premium Vue community DatePicker
componentRegistry.add('date', FieldCommunityDate);

const App = {
  name: 'App',
  setup() {
    const showNotifications = ref(false);
    const showCompanyMenu = ref(false);
    const showProfileMenu = ref(false);
    const showDevMenu = ref(false);

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
      window.addEventListener('click', () => {
        showNotifications.value = false;
        showCompanyMenu.value = false;
        showProfileMenu.value = false;
        showDevMenu.value = false;
      });

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
          
          // Company Switcher (Multi-Company Selector)
          isAuthenticated.value ? h('div', {
            class: 'o_company_switcher',
            onClick: (e: any) => {
              e.stopPropagation();
              showCompanyMenu.value = !showCompanyMenu.value;
              showNotifications.value = false;
              showProfileMenu.value = false;
              showDevMenu.value = false;
            }
          }, [
            h('span', null, `🏢 ${activeCompany.value.name}`),
            showCompanyMenu.value ? h('ul', { class: 'o_company_dropdown', onClick: (e: any) => e.stopPropagation() },
              availableCompanies.value.map(c => h('li', {
                class: ['o_company_item', activeCompany.value.id === c.id ? 'active' : ''],
                onClick: async () => {
                  switchCompany(c.id);
                  showCompanyMenu.value = false;
                  if (activeAction.value) {
                    await executeAction(activeAction.value.id, { resetOffset: true });
                  }
                }
              }, [
                h('span', null, c.name),
                activeCompany.value.id === c.id ? h('span', { style: 'color: #714B67;' }, '✓') : null
              ]))
            ) : null
          ]) : null,

          // Developer Debug Menu (Beetle Icon Dropdown)
          isAuthenticated.value ? h('div', {
            class: 'o_developer_menu_container',
            onClick: (e: any) => {
              e.stopPropagation();
              showDevMenu.value = !showDevMenu.value;
              showNotifications.value = false;
              showCompanyMenu.value = false;
              showProfileMenu.value = false;
            }
          }, [
            h('span', { style: 'font-size: 16px;' }, '🪲'),
            showDevMenu.value ? h('div', { class: 'o_dev_dropdown', onClick: (e: any) => e.stopPropagation() }, [
              h('div', { class: 'o_dev_header' }, 'Odoo Developer Debug Tools'),
              h('a', {
                class: 'o_dev_item',
                onClick: () => {
                  alert(`Active Views AST Info:\n${JSON.stringify({
                    listArch: listArch.value,
                    formArch: formArch.value,
                  }, null, 2)}`);
                  showDevMenu.value = false;
                }
              }, '🖨️ View Fields AST Metadata'),
              h('a', {
                class: 'o_dev_item',
                onClick: () => {
                  alert(`Context Context State Dump:\n${JSON.stringify({
                    activeContext: activeContext.value,
                    company_id: activeCompany.value.id,
                    limit: currentLimit.value,
                    offset: currentOffset.value,
                  }, null, 2)}`);
                  showDevMenu.value = false;
                }
              }, '📋 Dump Active Context State'),
              h('a', {
                class: 'o_dev_item',
                onClick: () => {
                  addNotification('Developer Cache Cleared Successfully.', 'warning');
                  showDevMenu.value = false;
                }
              }, '⚡ Clear Developer Cache')
            ]) : null
          ]) : null,

          // Notifications Bell Widget
          isAuthenticated.value ? h('div', {
            class: 'o_navbar_notifications',
            onClick: (e: any) => {
              e.stopPropagation();
              showNotifications.value = !showNotifications.value;
              showCompanyMenu.value = false;
              showProfileMenu.value = false;
              showDevMenu.value = false;
              if (showNotifications.value) markAllAsRead();
            }
          }, [
            h('span', { style: 'font-size: 18px;' }, '🔔'),
            unreadCount.value > 0 ? h('span', { class: 'o_notification_badge' }, unreadCount.value) : null,
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
                        h('span', { style: n.type === 'success' ? 'color: #22c55e; font-weight: bold;' : n.type === 'error' ? 'color: #ef4444; font-weight: bold;' : 'color: #0284c7; font-weight: bold;' }, n.type.toUpperCase()),
                        h('span', { class: 'o_notification_time' }, n.date)
                      ]),
                      h('div', { style: 'margin-top: 4px; line-height: 1.4;' }, n.message)
                    ]))
              )
            ]) : null
          ]) : null,

          // User Profile Menu Selector
          isAuthenticated.value ? h('div', {
            class: 'o_user_profile_container',
            onClick: (e: any) => {
              e.stopPropagation();
              showProfileMenu.value = !showProfileMenu.value;
              showNotifications.value = false;
              showCompanyMenu.value = false;
              showDevMenu.value = false;
            }
          }, [
            h('span', { style: 'font-weight: 500;' }, 'Administrator'),
            h('div', { class: 'o_user_avatar' }, 'A'),
            showProfileMenu.value ? h('div', { class: 'o_profile_dropdown', onClick: (e: any) => e.stopPropagation() }, [
              h('a', {
                class: 'o_profile_item',
                onClick: () => {
                  addNotification('User Administrator Profile opened.', 'info');
                  showProfileMenu.value = false;
                }
              }, '👤 My Profile'),
              h('a', {
                class: 'o_profile_item',
                onClick: () => {
                  addNotification('Preferences settings opened.', 'info');
                  showProfileMenu.value = false;
                }
              }, '⚙️ Preferences'),
              h('a', {
                class: 'o_profile_item logout',
                onClick: () => {
                  handleDisconnect();
                  showProfileMenu.value = false;
                }
              }, '🚪 Log Out')
            ]) : null
          ]) : null
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
          onBackToList: () => { activeViewType.value = resolveDefaultViewType(activeAction.value); readonlyMode.value = true; },
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
