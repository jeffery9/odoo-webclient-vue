import { RPCClient } from '../rpc/client.js';

export class RecordProxy {
  private model: string;
  private _data: Record<string, any>;
  private _changes: Record<string, any> = {};
  private client?: RPCClient;

  constructor(model: string, data: any, client?: RPCClient) {
    this.model = model;
    this._data = { ...data };
    this.client = client;
  }

  get id(): number | null {
    return this._data.id ?? null;
  }

  get isDirty(): boolean {
    return Object.keys(this._changes).length > 0;
  }

  get changes(): Record<string, any> {
    return this._changes;
  }

  get(field: string): any {
    if (field in this._changes) {
      return this._changes[field];
    }
    return this._data[field];
  }

  set(field: string, value: any): void {
    if (this._data[field] === value) {
      delete this._changes[field];
    } else {
      this._changes[field] = value;
    }
  }

  discard(): void {
    this._changes = {};
  }

  async save(): Promise<void> {
    if (!this.isDirty) return;

    if (!this.client) {
      throw new Error('Cannot save record changes: no RPCClient attached');
    }

    const id = this.id;
    if (id !== null) {
      // Existing record update
      await this.client.write(this.model, [id], this._changes);
      Object.assign(this._data, this._changes);
      this._changes = {};
    } else {
      // New record creation
      const newId = await this.client.create(this.model, this._changes);
      this._data.id = newId;
      Object.assign(this._data, this._changes);
      this._changes = {};
    }
  }
}
