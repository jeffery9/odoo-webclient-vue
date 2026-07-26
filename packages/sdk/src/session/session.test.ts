import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionManager } from './session.js';
import { RPCClient } from '../rpc/client.js';

describe('Odoo Session Runtime', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should authenticate login and parse Odoo session parameters correctly', async () => {
    const mockAuthResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        uid: 2,
        name: 'Mitchell Admin',
        db: 'demo_db',
        company_id: 1,
        user_companies: {
          allowed_companies: {
            1: { id: 1, name: 'YourCompany' }
          },
          current_company: { id: 1, name: 'YourCompany' }
        },
        currencies: {
          1: { symbol: '$', position: 'before' }
        },
        user_context: { lang: 'en_US', tz: 'UTC' },
        csrf_token: 'auth_csrf_token_abc123'
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAuthResponse
    });

    const client = new RPCClient({ endpoint: 'http://localhost:8069' });
    const session = new SessionManager(client);

    await session.login('demo_db', 'admin', 'admin_pass');

    expect(session.isAuthenticated).toBe(true);
    expect(session.uid).toBe(2);
    expect(session.name).toBe('Mitchell Admin');
    expect(session.db).toBe('demo_db');
    expect(session.companyId).toBe(1);
    expect(session.csrfToken).toBe('auth_csrf_token_abc123');
    expect(client.getCSRFToken()).toBe('auth_csrf_token_abc123');
    expect(session.currencies).toEqual({
      1: { symbol: '$', position: 'before' }
    });
    expect(session.userContext).toEqual({ lang: 'en_US', tz: 'UTC' });
  });

  test('should clear state on logout', async () => {
    // 1. Initial State as authenticated
    const client = new RPCClient({ endpoint: 'http://localhost:8069' });
    const session = new SessionManager(client);

    session.setSessionState({
      uid: 2,
      name: 'Mitchell Admin',
      db: 'demo_db',
      companyId: 1,
      userCompanies: { 1: { id: 1, name: 'YourCompany' } },
      currencies: { 1: { symbol: '$', position: 'before' } },
      userContext: { lang: 'en_US', tz: 'UTC' },
      csrfToken: 'auth_csrf_token_abc123'
    });

    expect(session.isAuthenticated).toBe(true);
    expect(client.getCSRFToken()).toBe('auth_csrf_token_abc123');

    // Mock logout destroy call
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jsonrpc: '2.0', id: 2, result: null })
    });

    await session.logout();

    expect(session.isAuthenticated).toBe(false);
    expect(session.uid).toBeNull();
    expect(session.name).toBeNull();
    expect(session.csrfToken).toBeNull();
    expect(client.getCSRFToken()).toBeNull();
    expect(session.userContext).toEqual({});
  });
});
