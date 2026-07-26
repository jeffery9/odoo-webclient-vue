export interface HashLocation {
  hash: string;
}

export class HashRouter {
  private location: HashLocation;
  private listeners: ((params: Record<string, string>) => void)[] = [];

  constructor(location?: HashLocation) {
    this.location = location || (typeof globalThis !== 'undefined' && (globalThis as any).location) || { hash: '' };
    
    // Bind real browser window event listener if present
    if (typeof globalThis !== 'undefined' && (globalThis as any).window) {
      (globalThis as any).window.addEventListener('hashchange', () => this.triggerNavigate());
    }
  }

  getParams(): Record<string, string> {
    const hash = this.location.hash || '';
    const cleanHash = hash.replace(/^#\??/, '');
    if (!cleanHash) return {};

    const params: Record<string, string> = {};
    const pairs = cleanHash.split('&');
    for (const pair of pairs) {
      const [key, val] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = val ? decodeURIComponent(val) : '';
      }
    }
    return params;
  }

  setParams(params: Record<string, string | number>): void {
    const pairs: string[] = [];
    for (const [key, val] of Object.entries(params)) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
    }
    const hashString = pairs.length > 0 ? `#${pairs.join('&')}` : '';
    this.location.hash = hashString;
  }

  onNavigate(callback: (params: Record<string, string>) => void): void {
    this.listeners.push(callback);
  }

  triggerNavigate(): void {
    const currentParams = this.getParams();
    for (const listener of this.listeners) {
      try {
        listener(currentParams);
      } catch (e) {
        console.error('Error during router navigation callback execution', e);
      }
    }
  }
}
