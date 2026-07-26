import { ref } from 'vue';
import { RPCClient, SessionManager, OdooBusClient } from '@odoo/sdk';
import { getSavedConfig, saveConfig } from '../config.js';
import { addNotification } from '../layout/notification.js';
import { loadCompaniesFromSession } from './company.js';

const savedConfig = getSavedConfig();

export const isAuthenticated = ref(false);
export const isConnecting = ref(false);
export const isDevMode = ref(savedConfig.isDevMode);
export const hostUrl = ref(savedConfig.hostUrl);
export const dbName = ref(savedConfig.dbName);
export const username = ref(savedConfig.username);
export const password = ref(savedConfig.password);
export const activeClient = ref<RPCClient | null>(null);
export const activeBusClient = ref<OdooBusClient | null>(null);

export const persistSettings = () => {
  saveConfig({
    isDevMode: isDevMode.value,
    hostUrl: hostUrl.value,
    dbName: dbName.value,
    username: username.value,
    password: password.value,
  });
};

export const handleConnect = async (onSuccess: (client: RPCClient) => Promise<void>) => {
  if (isConnecting.value) return;
  isConnecting.value = true;
  try {
    const client = new RPCClient({ endpoint: hostUrl.value });
    const session = new SessionManager(client);
    await session.login(dbName.value, username.value, password.value);

    // Dynamic multi-company load from session response metadata
    loadCompaniesFromSession(session);

    activeClient.value = client;
    isAuthenticated.value = true;
    persistSettings();

    // Boot real-time WebSocket messaging bus
    try {
      const bus = new OdooBusClient(hostUrl.value);
      bus.connect();
      bus.subscribe(['res.partner', 'mail.channel'], (events) => {
        events.forEach(e => {
          addNotification(`[Live WS] ${e.message}`, 'info');
        });
      });
      activeBusClient.value = bus;
    } catch (err) {
      console.warn('Failed to connect to real-time Odoo websocket bus:', err);
    }

    addNotification(`Successfully authenticated session with Odoo database: ${dbName.value}`, 'success');

    await onSuccess(client);
  } catch (err: any) {
    addNotification(`Failed to connect to Odoo backend: ${err.message}`, 'error');
    alert('Failed to connect to Odoo backend: ' + err.message);
  } finally {
    isConnecting.value = false;
  }
};

export const handleAddonAutoLogin = async (onSuccess: (client: RPCClient) => Promise<void>) => {
  isConnecting.value = true;
  try {
    const relativeClient = new RPCClient({ endpoint: window.location.origin });
    await onSuccess(relativeClient);

    activeClient.value = relativeClient;
    isAuthenticated.value = true;

    // Boot real-time WebSocket messaging bus for same-origin session
    try {
      const bus = new OdooBusClient(window.location.origin);
      bus.connect();
      bus.subscribe(['res.partner', 'mail.channel'], (events) => {
        events.forEach(e => {
          addNotification(`[Live WS] ${e.message}`, 'info');
        });
      });
      activeBusClient.value = bus;
    } catch (err) {
      console.warn('Failed to connect relative session WS:', err);
    }

    addNotification('Successfully logged in using SSO session credentials.', 'success');
  } catch (err: any) {
    isAuthenticated.value = false;
  } finally {
    isConnecting.value = false;
  }
};

export const handleDisconnectCleanup = (onCleanup: () => void) => {
  if (activeBusClient.value) {
    activeBusClient.value.close();
    activeBusClient.value = null;
  }
  isAuthenticated.value = false;
  activeClient.value = null;
  addNotification('User Administrator logged out of Odoo session.', 'info');
  onCleanup();
};
