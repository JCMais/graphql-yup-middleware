import { Schema } from 'yup';
import { GraphQLResolveInfo } from 'graphql';
import { YupMiddlewareOptions } from './types';

declare module 'graphql/type/definition' {
  export interface GraphQLField<
    TSource,
    TContext,
    TArgs = { [key: string]: any }
  > {
    validationOptions?: YupMiddlewareOptions;
    validationSchema?:
      | Schema<TArgs>
      | ((
          root: TSource,
          args: TArgs,
          context: TContext,
          info: GraphQLResolveInfo,
        ) => Schema<TArgs>);
  }
}
