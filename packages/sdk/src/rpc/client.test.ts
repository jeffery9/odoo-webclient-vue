import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { RPCClient, OdooAccessError, OdooValidationError } from './client.js';

describe('Odoo RPC Client & Batching', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should execute standard single call_kw RPC request', async () => {
    const mockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: { name: 'Administrator', id: 2 }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const client = new RPCClient({ endpoint: 'http://localhost:8069' });
    const result = await client.call('res.users', 'read', [[2]], { fields: ['name'] });

    expect(result).toEqual({ name: 'Administrator', id: 2 });
    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, options] = (fetch as any).mock.calls[0];
    expect(url).toBe('http://localhost:8069/web/dataset/call_kw');

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      jsonrpc: '2.0',
      method: 'call',
      id: expect.any(Number),
      params: {
        model: 'res.users',
        method: 'read',
        args: [[2]],
        kwargs: { fields: ['name'] }
      }
    });
  });

  test('should batch multiple concurrent requests into a single HTTP POST', async () => {
    (fetch as any).mockImplementationOnce(async (url: string, options: any) => {
      const requests = JSON.parse(options.body);
      const mockBatchResponse = requests.map((req: any, index: number) => ({
        jsonrpc: '2.0',
        id: req.id,
        result: index === 0 ? 'value_a' : 'value_b'
      }));
      return {
        ok: true,
        json: async () => mockBatchResponse
      };
    });

    const client = new RPCClient({ endpoint: 'http://localhost:8069', batch: true });

    // Trigger two requests in the same microtask tick
    const promiseA = client.call('res.partner', 'name_get', [[1]], {});
    const promiseB = client.call('res.partner', 'name_get', [[2]], {});

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    expect(resA).toBe('value_a');
    expect(resB).toBe('value_b');

    // Only one HTTP request should have been made
    expect(fetch).toHaveBeenCalledTimes(1);

    const [, options] = (fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    expect(body[0].params.args).toEqual([[1]]);
    expect(body[1].params.args).toEqual([[2]]);
  });

  test('should support high-level ORM helper shortcuts', async () => {
    const client = new RPCClient({ endpoint: 'http://localhost:8069' });

    // 1. read
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: [{ id: 5, name: 'Partner 5' }] })
    });
    const partners = await client.read('res.partner', [5], ['name']);
    expect(partners).toEqual([{ id: 5, name: 'Partner 5' }]);

    // 2. create
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 2, result: 10 })
    });
    const newId = await client.create('res.partner', { name: 'New Partner' });
    expect(newId).toBe(10);
  });

  test('should map server errors to typed client-side Odoo exceptions', async () => {
    const client = new RPCClient({ endpoint: 'http://localhost:8069' });

    // Simulate standard Odoo AccessError response structure
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: 200,
          message: 'Odoo Server Error',
          data: {
            name: 'odoo.exceptions.AccessError',
            message: 'Document type: Partner, Operation: read'
          }
        }
      })
    });

    await expect(client.read('res.partner', [5], [])).rejects.toThrow(OdooAccessError);
  });
});
