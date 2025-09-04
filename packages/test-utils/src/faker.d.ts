declare module '@faker-js/faker' {
  export namespace faker {
    export const internet: {
      email: () => string;
      userName: () => string;
    };
    export const person: {
      fullName: () => string;
      firstName: () => string;
      lastName: () => string;
    };
    export const company: {
      name: () => string;
    };
    export const datatype: {
      uuid: () => string;
      number: (options?: {min?: number, max?: number}) => number;
    };
    export const date: {
      past: () => Date;
      recent: () => Date;
    };
    export const helpers: {
      arrayElement: <T>(array: T[]) => T;
    };
  }
}