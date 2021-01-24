import * as Yup from 'yup';
import { GraphQLResolveInfo } from 'graphql';

export type YupMiddlewareErrorContext<TContext = any, TArgs = any> = {
  root: any;
  args: TArgs;
  context: TContext;
  info: GraphQLResolveInfo;
};

export type YupMiddlewareOptions = {
  errorPayloadBuilder?: (
    error: Yup.ValidationError,
    errorContext: YupMiddlewareErrorContext,
  ) => any;
  shouldTransformArgs?: boolean;
  yupOptions?: Parameters<Yup.BaseSchema['validate']>[1];
};

export type YupMiddlewareFieldValidationError = {
  field: string;
  errors: string[];
};

export type YupMiddlewareDefaultError = {
  message: string;
  details: YupMiddlewareFieldValidationError[];
};

export interface GraphQLExtensionsYupMiddleware<
  _TSource,
  _TContext,
  _TArgs extends Record<string, any> = Record<string, any>
> {
  validationOptions?: YupMiddlewareOptions;
  validationSchema:
    | Yup.ObjectSchema<_TArgs>
    | ((
        root: _TSource,
        args: _TArgs,
        context: _TContext,
        info: GraphQLResolveInfo,
      ) => Yup.ObjectSchema<_TArgs>);
}
