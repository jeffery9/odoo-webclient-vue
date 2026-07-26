export interface ActionDescriptor {
  name: string;
  res_model: string;
  type: string;
  views: [any, string][];
  target?: 'current' | 'new';
  res_id?: number;
}

export class ActionManager {
  stack: ActionDescriptor[] = [];
  dialogStack: ActionDescriptor[] = [];

  get breadcrumbs(): string[] {
    return this.stack.map(action => action.name);
  }

  get currentAction(): ActionDescriptor | null {
    if (this.stack.length === 0) return null;
    return this.stack[this.stack.length - 1];
  }

  async doAction(action: ActionDescriptor): Promise<void> {
    if (action.target === 'new') {
      this.dialogStack.push(action);
    } else {
      this.stack.push(action);
    }
  }

  goBack(): void {
    if (this.stack.length > 0) {
      this.stack.pop();
    }
  }

  closeDialog(): void {
    if (this.dialogStack.length > 0) {
      this.dialogStack.pop();
    }
  }
}
