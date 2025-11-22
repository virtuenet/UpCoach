declare module 'msw' {
  type HttpRequestResolverExtraParams = {
    ctx: {
      status: (code: number) => any;
      json: (body: any) => any;
    };
    req: {
      json: () => Promise<any>;
    };
    res: any;
  };

  export const rest: {
    get: (path: string, resolver: (req: HttpRequestResolverExtraParams['req'], res: HttpRequestResolverExtraParams['res'], ctx: HttpRequestResolverExtraParams['ctx']) => any) => any;
    post: (path: string, resolver: (req: HttpRequestResolverExtraParams['req'], res: HttpRequestResolverExtraParams['res'], ctx: HttpRequestResolverExtraParams['ctx']) => any) => any;
    put: (path: string, resolver: (req: HttpRequestResolverExtraParams['req'], res: HttpRequestResolverExtraParams['res'], ctx: HttpRequestResolverExtraParams['ctx']) => any) => any;
    patch: (path: string, resolver: (req: HttpRequestResolverExtraParams['req'], res: HttpRequestResolverExtraParams['res'], ctx: HttpRequestResolverExtraParams['ctx']) => any) => any;
    delete: (path: string, resolver: (req: HttpRequestResolverExtraParams['req'], res: HttpRequestResolverExtraParams['res'], ctx: HttpRequestResolverExtraParams['ctx']) => any) => any;
  };
}