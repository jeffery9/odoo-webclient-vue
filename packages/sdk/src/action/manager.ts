export interface ActionDescriptor {
  id?: number;
  name: string;
  type: string;
  res_model?: string;
  views?: [any, string][];
  target?: 'current' | 'new';
  res_id?: number;
  // Report Action fields
  report_name?: string;
  report_type?: 'qweb-pdf' | 'qweb-html' | string;
  context?: Record<string, any>;
  data?: any;
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

  getReportDownloadUrl(action: ActionDescriptor, activeIds: number[] | string = []): string {
    const reportType = action.report_type === 'qweb-html' ? 'html' : 'pdf';
    const ids = Array.isArray(activeIds) ? activeIds.join(',') : activeIds;
    const reportUrl = `/report/${reportType}/${action.report_name}/${ids}`;
    const downloadData = [reportUrl, reportType];
    return `/report/download?data=${encodeURIComponent(JSON.stringify(downloadData))}`;
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
