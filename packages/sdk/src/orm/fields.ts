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

  static Boolean = {
    parse(v: any): boolean {
      if (v === 'false') return false;
      return !!v;
    },
    format(v: boolean): string {
      return v ? 'Yes' : 'No';
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

  static Many2many = {
    replaceWith(ids: number[]): any[] {
      return [[6, 0, ids]];
    },
    linkTo(id: number): any[] {
      return [[4, id, 0]];
    }
  };
}
