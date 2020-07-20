interface LoadParams {
  url: string;
}

interface ReadParams {
  type: 'csv' | 'json';
  parse: 'auto';
}

declare module 'datalib' {
  export interface DLFieldProfile {
    field: string;
    type: string;
    unique: { [value: string]: number };
    count: number;
    valid: number;
    missing: number;
    distinct: number;
    min: number | Date;
    max: number | Date;
    mean: number;
    stdev: number;
    median: number;
    q1: number;
    q3: number;
    modeskew: number;
  }

  export function load(param: LoadParams): any;
  export function read(data: any, params: ReadParams): any;
  export function summary(data: any): DLFieldProfile[];
  export function groupby(
    field: string
  ): {
    execute: (data: any) => any;
  };

  export const format: {
    summary: (data: any) => string;
  };
}

declare module 'ddl' {
  export function postgresql(
    db: any,
    table: string,
    callback: (err: any, ddl: any) => void
  ): void;
}

// declare module 'pg' {
//   export class Client {
//     connect(connection: {
//       user: string;
//       host: string;
//       database: string;
//       password: string;
//       port: number;
//     }): void;
//   }
// }

// declare module 'datalib/src/import/load' {
//   function load(param: any, callback: any): void;
//   export = load;
// }

// declare module 'datalib/src/bins/bins' {
//   function bins(param: any): any;
//   namespace bins {} // https://github.com/Microsoft/TypeScript/issues/5073
//   export = bins;
// }

// declare module 'datalib/src/util' {
//   export function cmp(a: any, b: any): number;
//   export function keys(a: any): Array<string>;
//   export function extend(a: any, b: any, ...rest: any[]): any;
//   export function duplicate<T>(a: T): T;
//   export function isArray(a: any | any[]): a is any[];
//   export function vals(a: any): any[];
//   export function truncate(a: string, length: number): string;
//   export function toMap(a: any): { [key: string]: 1 };
//   export function isObject(a: any): a is object;
//   export function isString(a: any): a is string;
//   export function isNumber(a: any): a is number;
//   export function isBoolean(a: any): a is boolean;
// }

// declare module 'datalib/src/import/readers' {
//   export function json(param: any): any;
// }

// declare module 'datalib/src/stats' {
//   export function summary(data: any): DLFieldProfile[];
// }

// declare module 'datalib/src/import/type' {
//   export function inferAll(
//     data: any[],
//     fields?: any[]
//   ): { [field: string]: string };
// }
