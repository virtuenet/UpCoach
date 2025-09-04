declare module 'fishery' {
  export interface ModelFactory<T> {
    build: (attributes?: Partial<T>) => T;
    buildList: (count: number, attributes?: Partial<T>) => T[];
  }

  export function Factory<T>(options: {
    define: (f: any) => any;
  }): ModelFactory<T>;
}