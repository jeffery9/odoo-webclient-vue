export class Registry<T = any> {
  private items = new Map<string, T>();

  add(name: string, item: T): this {
    this.items.set(name, item);
    return this;
  }

  get(name: string): T {
    const item = this.items.get(name);
    if (!item) {
      throw new Error(`Registry item not found: ${name}`);
    }
    return item;
  }

  has(name: string): boolean {
    return this.items.has(name);
  }
}

export const componentRegistry = new Registry<any>();
export const viewRegistry = new Registry<any>();
