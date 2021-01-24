import 'graphql/type/definition';

import { GraphQLExtensionsYupMiddleware } from './types';

// We need to be merged to improve the types here https://github.com/graphql/graphql-js/pull/2465

declare module 'graphql/type/definition' {
  export interface GraphQLFieldExtensions<
    _TSource,
    _TContext,
    _TArgs = { [argName: string]: any }
  > {
    /**
     * Options to be passed to the yup middleware. This is only used if this field is a Mutation
     */
    yupMiddleware?: GraphQLExtensionsYupMiddleware<_TSource, _TContext, _TArgs>;
  }
}
