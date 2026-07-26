export class Fields {
  static Char = {
    parse(v: any): string {
      if (v === null || v === undefined) return '';
      return String(v);
    },
    format(v: string | null | undefined): string {
      return v ? String(v) : '';
    }
  };

  static Text = {
    parse(v: any): string {
      if (v === null || v === undefined) return '';
      return String(v);
    },
    format(v: string | null | undefined): string {
      return v ? String(v) : '';
    }
  };

  static Html = {
    parse(v: any): string {
      if (v === null || v === undefined) return '';
      return String(v);
    },
    format(v: string | null | undefined): string {
      return v ? String(v) : '';
    }
  };

  static Integer = {
    parse(v: any): number {
      if (v === null || v === undefined || v === '') return 0;
      const num = Math.round(Number(v));
      return isNaN(num) ? 0 : num;
    },
    format(v: number): string {
      return String(v);
    }
  };

  static Float = {
    parse(v: any): number {
      if (v === null || v === undefined || v === '') return 0.0;
      const num = Number(v);
      return isNaN(num) ? 0.0 : num;
    },
    format(v: number): string {
      return String(v);
    }
  };

  static Monetary = {
    parse(v: any): number {
      if (v === null || v === undefined || v === '') return 0.0;
      const num = Number(v);
      return isNaN(num) ? 0.0 : num;
    },
    format(v: number): string {
      return String(v);
    }
  };

  static Boolean = {
    parse(v: any): boolean {
      if (v === 'false') return false;
      return !!v;
    },
    format(v: boolean): string {
      return v ? 'Yes' : 'No';
    }
  };

  static Selection = {
    parse(v: any): string {
      if (v === null || v === undefined) return '';
      return String(v);
    },
    format(v: string | null | undefined): string {
      return v ? String(v) : '';
    }
  };

  static Date = {
    parse(v: any): string {
      if (!v) return '';
      if (v instanceof globalThis.Date) {
        return v.toISOString().split('T')[0];
      }
      return String(v).split(' ')[0];
    },
    format(v: string | null | undefined): string {
      return v ? String(v) : '';
    }
  };

  static Datetime = {
    parse(v: any): string {
      if (!v) return '';
      if (v instanceof globalThis.Date) {
        return v.toISOString().replace('T', ' ').split('.')[0];
      }
      return String(v);
    },
    format(v: string | null | undefined): string {
      return v ? String(v) : '';
    }
  };

  static Many2one = {
    serialize(v: any): number | false {
      if (Array.isArray(v) && v.length > 0) {
        return Number(v[0]);
      }
      if (typeof v === 'number') {
        return v;
      }
      return false;
    }
  };

  static One2many = {
    replaceWith(ids: number[]): any[] {
      return [[6, 0, ids]];
    },
    add(values: Record<string, any>): any[] {
      return [[0, 0, values]];
    },
    update(id: number, values: Record<string, any>): any[] {
      return [[1, id, values]];
    },
    remove(id: number): any[] {
      return [[2, id, 0]];
    }
  };

  static Many2many = {
    replaceWith(ids: number[]): any[] {
      return [[6, 0, ids]];
    },
    linkTo(id: number): any[] {
      return [[4, id, 0]];
    }
  };
}
