import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RecordProxy } from './record.js';
import { RPCClient } from '../rpc/client.js';

describe('Odoo Reactive Record Proxy & Transaction Cache', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('should read standard pristine field values', () => {
    const pristineData = { id: 42, name: 'OBD2 Scanner', price: 99.9 };
    const record = new RecordProxy('product.product', pristineData);

    // Read through proxy getters
    expect(record.get('name')).toBe('OBD2 Scanner');
    expect(record.get('price')).toBe(99.9);
    expect(record.isDirty).toBe(false);
  });

  test('should trap field writes, accumulate in dirty changes, and support discard', () => {
    const pristineData = { id: 42, name: 'OBD2 Scanner', price: 99.9 };
    const record = new RecordProxy('product.product', pristineData);

    // Write fields
    record.set('name', 'Premium OBD2 Scanner');
    
    expect(record.isDirty).toBe(true);
    expect(record.get('name')).toBe('Premium OBD2 Scanner'); // should return dirty value
    expect(record.get('price')).toBe(99.9); // should return unchanged pristine value
    expect(record.changes).toEqual({ name: 'Premium OBD2 Scanner' });

    // Discard/rollback changes
    record.discard();
    expect(record.isDirty).toBe(false);
    expect(record.get('name')).toBe('OBD2 Scanner'); // rolled back
    expect(record.changes).toEqual({});
  });

  test('should save changes to Odoo server using RPCClient', async () => {
    // Mock standard Odoo write response (returns true on success)
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 1, result: true })
    });

    const client = new RPCClient({ endpoint: 'http://localhost:8069' });
    const pristineData = { id: 42, name: 'OBD2 Scanner', price: 99.9 };
    const record = new RecordProxy('product.product', pristineData, client);

    record.set('name', 'Premium OBD2 Scanner');
    
    await record.save();

    expect(record.isDirty).toBe(false);
    expect(record.get('name')).toBe('Premium OBD2 Scanner'); // pristine data is now updated
    expect(record.changes).toEqual({});
    
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = (fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.params.method).toBe('write');
    expect(body.params.args).toEqual([[42], { name: 'Premium OBD2 Scanner' }]);
  });
});
