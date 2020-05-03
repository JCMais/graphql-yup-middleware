import { Schema } from 'yup';
import { GraphQLResolveInfo } from 'graphql';
import { YupMiddlewareOptions } from './types';

// We need to be merged to improve the types here https://github.com/graphql/graphql-js/pull/2465

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
