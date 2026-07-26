import { RPCClient } from '../rpc/client.js';

export interface SessionState {
  uid: number | null;
  name: string | null;
  db: string | null;
  companyId: number | null;
  userCompanies: Record<number, any>;
  currencies: Record<number, any>;
  userContext: Record<string, any>;
  csrfToken: string | null;
}

export class SessionManager {
  private client: RPCClient;
  private _uid: number | null = null;
  private _name: string | null = null;
  private _db: string | null = null;
  private _companyId: number | null = null;
  private _userCompanies: Record<number, any> = {};
  private _currencies: Record<number, any> = {};
  private _userContext: Record<string, any> = {};
  private _csrfToken: string | null = null;

  constructor(client: RPCClient) {
    this.client = client;
  }

  get isAuthenticated(): boolean {
    return this._uid !== null;
  }

  get uid(): number | null {
    return this._uid;
  }

  get name(): string | null {
    return this._name;
  }

  get db(): string | null {
    return this._db;
  }

  get companyId(): number | null {
    return this._companyId;
  }

  get userCompanies(): Record<number, any> {
    return this._userCompanies;
  }

  get currencies(): Record<number, any> {
    return this._currencies;
  }

  get userContext(): Record<string, any> {
    return this._userContext;
  }

  get csrfToken(): string | null {
    return this._csrfToken;
  }

  async login(db: string, login: string, password: string): Promise<any> {
    const result = await this.client.request('/web/session/authenticate', {
      db,
      login,
      password
    });

    if (result) {
      this._uid = result.uid ?? null;
      this._name = result.name ?? null;
      this._db = result.db ?? null;
      this._companyId = result.company_id ?? null;
      this._userCompanies = result.user_companies?.allowed_companies || {};
      this._currencies = result.currencies || {};
      this._userContext = result.user_context || {};
      this._csrfToken = result.csrf_token ?? null;
      
      // Propagate the CSRF token to the RPCClient for subsequent POST requests
      this.client.setCSRFToken(this._csrfToken);
    }

    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.client.request('/web/session/destroy', {});
    } catch (e) {
      console.warn('Failed to call session destroy on server', e);
    } finally {
      this.clearState();
    }
  }

  setSessionState(state: Partial<SessionState>): void {
    if (state.uid !== undefined) this._uid = state.uid;
    if (state.name !== undefined) this._name = state.name;
    if (state.db !== undefined) this._db = state.db;
    if (state.companyId !== undefined) this._companyId = state.companyId;
    if (state.userCompanies !== undefined) this._userCompanies = state.userCompanies;
    if (state.currencies !== undefined) this._currencies = state.currencies;
    if (state.userContext !== undefined) this._userContext = state.userContext;
    if (state.csrfToken !== undefined) {
      this._csrfToken = state.csrfToken;
      this.client.setCSRFToken(state.csrfToken);
    }
  }

  private clearState(): void {
    this._uid = null;
    this._name = null;
    this._db = null;
    this._companyId = null;
    this._userCompanies = {};
    this._currencies = {};
    this._userContext = {};
    this._csrfToken = null;
    this.client.setCSRFToken(null);
  }
}
