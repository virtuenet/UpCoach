declare module '@hookform/resolvers/zod' {
  import { Resolver } from 'react-hook-form';
  import { z } from 'zod';

  export function zodResolver<T extends z.ZodType>(schema: T): Resolver<z.infer<T>>;
}
