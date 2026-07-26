import { RPCClient } from '../rpc/client.js';

export class RecordProxy {
  private model: string;
  private _data: Record<string, any>;
  private _changes: Record<string, any> = {};
  private client?: RPCClient;
  private onchangeHandlers: { fields: string[]; handler: (record: RecordProxy) => void }[] = [];
  private isTriggeringOnchange = false;

  constructor(model: string, data: any, client?: RPCClient) {
    this.model = model;
    this._data = { ...data };
    this.client = client;
  }

  get modelName(): string {
    return this.model;
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

    // Trigger onchange handlers if we are not already in a triggering loop
    if (!this.isTriggeringOnchange) {
      this.isTriggeringOnchange = true;
      try {
        for (const { fields, handler } of this.onchangeHandlers) {
          if (fields.includes(field)) {
            handler(this);
          }
        }
      } finally {
        this.isTriggeringOnchange = false;
      }
    }
  }

  registerOnchange(fields: string[], handler: (record: RecordProxy) => void): void {
    this.onchangeHandlers.push({ fields, handler });
  }

  discard(): void {
    this._changes = {};
  }

  async save(context?: any): Promise<void> {
    if (!this.isDirty) return;

    if (!this.client) {
      throw new Error('Cannot save record changes: no RPCClient attached');
    }

    const id = this.id;
    if (id !== null) {
      await this.client.write(this.model, [id], this._changes, context);
      Object.assign(this._data, this._changes);
      this._changes = {};
    } else {
      // Merge initial defaults inside _data with dirty changes inside _changes for new record creations
      const creationValues = { ...this._data, ...this._changes };
      delete creationValues.id; // Ensure raw null id is omitted
      const newId = await this.client.create(this.model, creationValues, context);
      this._data.id = newId;
      Object.assign(this._data, this._changes);
      this._changes = {};
    }
  }
}
