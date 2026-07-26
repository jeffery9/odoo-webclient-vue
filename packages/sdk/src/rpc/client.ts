export class OdooError extends Error {
  constructor(message: string, public readonly code?: number, public readonly data?: any) {
    super(message);
    this.name = 'OdooError';
  }
}

export class OdooAccessError extends OdooError {
  constructor(message: string, code?: number, data?: any) {
    super(message, code, data);
    this.name = 'OdooAccessError';
  }
}

export class OdooValidationError extends OdooError {
  constructor(message: string, code?: number, data?: any) {
    super(message, code, data);
    this.name = 'OdooValidationError';
  }
}

export interface RPCClientOptions {
  endpoint: string;
  batch?: boolean;
}

interface QueuedRequest {
  id: number;
  payload: any;
  resolve: (value: any) => void;
  reject: (err: any) => void;
}

export class RPCClient {
  private endpoint: string;
  private isBatchEnabled: boolean;
  private queue: QueuedRequest[] = [];
  private flushScheduled = false;
  private nextId = 1;
  private csrfToken: string | null = null;

  constructor(options: RPCClientOptions) {
    this.endpoint = options.endpoint.replace(/\/$/, '');
    this.isBatchEnabled = !!options.batch;
  }

  setCSRFToken(token: string | null): void {
    this.csrfToken = token;
  }

  getCSRFToken(): string | null {
    return this.csrfToken;
  }

  async call(model: string, method: string, args: any[], kwargs: any): Promise<any> {
    const id = this.nextId++;
    const params: any = {
      model,
      method,
      args,
      kwargs
    };
    if (this.csrfToken) {
      params.csrf_token = this.csrfToken;
    }

    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      id,
      params
    };

    if (this.isBatchEnabled) {
      return new Promise((resolve, reject) => {
        this.queue.push({ id, payload, resolve, reject });
        if (!this.flushScheduled) {
          this.flushScheduled = true;
          Promise.resolve().then(() => this.flush());
        }
      });
    }

    return this.request('/web/dataset/call_kw', payload.params);
  }

  // Unified HTTP Request Method
  async request(urlPath: string, params: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    let url = `${this.endpoint}${cleanPath}`;
    
    let response;
    if (method === 'GET') {
      const queryParams = new URLSearchParams();
      if (params) {
        for (const [key, val] of Object.entries(params)) {
          if (val !== undefined && val !== null) {
            queryParams.append(key, String(val));
          }
        }
      }
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      response = await fetch(url, {
        method: 'GET'
      });
    } else {
      const rpcParams = { ...params };
      if (this.csrfToken && !rpcParams.csrf_token) {
        rpcParams.csrf_token = this.csrfToken;
      }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          id: this.nextId++,
          params: rpcParams
        })
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();

    if (method === 'GET') {
      return json;
    }

    if (json.error) {
      throw RPCClient.parseError(json.error);
    }

    return json.result;
  }

  // High-Level ORM Helper Methods
  async loadMenus(): Promise<any> {
    return this.request('/web/webclient/load_menus', {}, 'GET');
  }

  async loadTranslations(lang = 'en_US', hash = ''): Promise<any> {
    return this.request('/web/webclient/translations', { lang, hash }, 'GET');
  }

  async loadAction(actionId: number): Promise<any> {
    return this.request('/web/action/load', { action_id: actionId });
  }

  async loadViews(model: string, views: [number | boolean, string][], options?: any): Promise<any> {
    const result = await this.call(model, 'get_views', [], {
      views,
      options: options || {}
    });

    // Adapt Odoo 19 get_views dict format into our legacy fields_views structure for client compatibility
    const fields_views: Record<string, any> = {};
    if (result && result.views) {
      for (const [vType, vDesc] of Object.entries(result.views)) {
        const key = vType === 'tree' ? 'list' : vType;
        fields_views[key] = vDesc;
      }
    }

    return {
      fields_views,
      models: result?.models || {}
    };
  }

  async read(model: string, ids: number[], fields?: string[]): Promise<any[]> {
    return this.call(model, 'read', [ids], { fields });
  }

  async create(model: string, vals: Record<string, any>, context?: any): Promise<number> {
    return this.call(model, 'create', [vals], { context });
  }

  async write(model: string, ids: number[], vals: Record<string, any>, context?: any): Promise<boolean> {
    return this.call(model, 'write', [ids, vals], { context });
  }

  async unlink(model: string, ids: number[], context?: any): Promise<boolean> {
    return this.call(model, 'unlink', [ids], { context });
  }

  async search_read(
    model: string,
    domain: any[],
    fields?: string[],
    limit?: number,
    offset?: number,
    context?: any
  ): Promise<any[]> {
    return this.call(model, 'search_read', [], { domain, fields, limit, offset, context });
  }

  private static parseError(error: any): Error {
    if (!error) return new Error('Unknown RPC Error');
    const msg = error.data?.message || error.message || 'JSON-RPC Error';
    const name = error.data?.name;

    if (name === 'odoo.exceptions.AccessError') {
      return new OdooAccessError(msg, error.code, error.data);
    }
    if (name === 'odoo.exceptions.ValidationError') {
      return new OdooValidationError(msg, error.code, error.data);
    }

    return new OdooError(msg, error.code, error.data);
  }

  private async flush(): Promise<void> {
    this.flushScheduled = false;
    const currentQueue = [...this.queue];
    this.queue = [];

    if (currentQueue.length === 0) return;

    const bodyPayload = currentQueue.map(q => q.payload);
    const url = `${this.endpoint}/web/dataset/call_kw`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const jsonResponses = await response.json();

      if (Array.isArray(jsonResponses)) {
        const responseMap = new Map<number, any>();
        for (const resp of jsonResponses) {
          responseMap.set(resp.id, resp);
        }

        for (const req of currentQueue) {
          const resp = responseMap.get(req.id);
          if (!resp) {
            req.reject(new Error(`No response received for request ID ${req.id}`));
          } else if (resp.error) {
            req.reject(RPCClient.parseError(resp.error));
          } else {
            req.resolve(resp.result);
          }
        }
      } else {
        throw new Error('Server did not return a standard JSON-RPC batch response array');
      }
    } catch (err) {
      for (const req of currentQueue) {
        req.reject(err);
      }
    }
  }
}
