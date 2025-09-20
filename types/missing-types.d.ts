// Missing type definitions for third-party packages
// This file provides minimal type definitions for packages that don't have proper @types packages

declare module '@babel/generator' {
  const generator: any;
  export = generator;
}

declare module '@babel/template' {
  const template: any;
  export = template;
}

declare module '@babel/traverse' {
  const traverse: any;
  export = traverse;
}

declare module 'body-parser' {
  const bodyParser: any;
  export = bodyParser;
}

declare module 'd3-color' {
  const d3Color: any;
  export = d3Color;
}

declare module 'd3-path' {
  const d3Path: any;
  export = d3Path;
}

declare module 'http-cache-semantics' {
  const httpCacheSemantics: any;
  export = httpCacheSemantics;
}

declare module 'istanbul-lib-report' {
  const istanbulLibReport: any;
  export = istanbulLibReport;
}

declare module 'ms' {
  const ms: any;
  export = ms;
}

declare module 'qs' {
  const qs: any;
  export = qs;
}

declare module 'range-parser' {
  const rangeParser: any;
  export = rangeParser;
}

declare module 'react-router' {
  const reactRouter: any;
  export = reactRouter;
}

declare module 'readdir-glob' {
  const readdirGlob: any;
  export = readdirGlob;
}

declare module 'send' {
  const send: any;
  export = send;
}

declare module 'serve-static' {
  const serveStatic: any;
  export = serveStatic;
}

declare module 'tough-cookie' {
  const toughCookie: any;
  export = toughCookie;
}

declare module 'yargs-parser' {
  const yargsParser: any;
  export = yargsParser;
}