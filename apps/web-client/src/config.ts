export interface ClientConfig {
  isDevMode: boolean;
  hostUrl: string;
  dbName: string;
  username: string;
  password: string;
}

// Detect if we are currently running as a compiled asset inside a real Odoo Addon Module.
export const isOdooAddonMode = (): boolean => {
  if (import.meta.env.DEV) {
    return false; // Force developer mode during Vite local development
  }
  // If served directly from Odoo paths or same origin without dev-specific paths
  return (
    window.location.pathname.includes('/static/') ||
    window.location.pathname.includes('/webclient') ||
    window.location.pathname.startsWith('/web')
  );
};

const STORAGE_KEY = 'odoo_client_config';

export const getSavedConfig = (): ClientConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore storage issues
  }

  // Smart defaults
  const addonMode = isOdooAddonMode();
  return {
    isDevMode: !addonMode,
    hostUrl: addonMode ? window.location.origin : 'http://localhost:8019',
    dbName: 'atmik_playwright_db',
    username: 'admin',
    password: 'admin'
  };
};

export const saveConfig = (config: Partial<ClientConfig>) => {
  const current = getSavedConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
