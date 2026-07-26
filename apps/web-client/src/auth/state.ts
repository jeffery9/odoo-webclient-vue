import { ref } from 'vue';
import { RPCClient, SessionManager } from '@odoo/sdk';
import { getSavedConfig, saveConfig } from '../config.js';
import { addNotification } from '../layout/notification.js';

const savedConfig = getSavedConfig();

export const isAuthenticated = ref(false);
export const isConnecting = ref(false);
export const isDevMode = ref(savedConfig.isDevMode);
export const hostUrl = ref(savedConfig.hostUrl);
export const dbName = ref(savedConfig.dbName);
export const username = ref(savedConfig.username);
export const password = ref(savedConfig.password);
export const activeClient = ref<RPCClient | null>(null);

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

    activeClient.value = client;
    isAuthenticated.value = true;
    persistSettings();

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
    addNotification('Successfully logged in using SSO session credentials.', 'success');
  } catch (err: any) {
    isAuthenticated.value = false;
  } finally {
    isConnecting.value = false;
  }
};

export const handleDisconnectCleanup = (onCleanup: () => void) => {
  isAuthenticated.value = false;
  activeClient.value = null;
  addNotification('User Administrator logged out of Odoo session.', 'info');
  onCleanup();
};
