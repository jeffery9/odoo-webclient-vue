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

  constructor(options: RPCClientOptions) {
    this.endpoint = options.endpoint.replace(/\/$/, '');
    this.isBatchEnabled = !!options.batch;
  }

  async call(model: string, method: string, args: any[], kwargs: any): Promise<any> {
    const id = this.nextId++;
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      id,
      params: {
        model,
        method,
        args,
        kwargs
      }
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

    return this.executeSingle(payload);
  }

  // High-Level ORM Helper Methods
  async read(model: string, ids: number[], fields?: string[]): Promise<any[]> {
    return this.call(model, 'read', [ids], { fields });
  }

  async create(model: string, vals: Record<string, any>): Promise<number> {
    return this.call(model, 'create', [vals], {});
  }

  async write(model: string, ids: number[], vals: Record<string, any>): Promise<boolean> {
    return this.call(model, 'write', [ids, vals], {});
  }

  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.call(model, 'unlink', [ids], {});
  }

  async search_read(
    model: string,
    domain: any[],
    fields?: string[],
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    return this.call(model, 'search_read', [], { domain, fields, limit, offset });
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

  private async executeSingle(payload: any): Promise<any> {
    const url = `${this.endpoint}/web/dataset/call_kw`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    if (json.error) {
      throw RPCClient.parseError(json.error);
    }

    return json.result;
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
