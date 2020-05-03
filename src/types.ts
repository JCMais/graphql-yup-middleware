import { ValidateOptions, ValidationError, Schema } from 'yup';
import { GraphQLResolveInfo } from 'graphql';

export type YupMiddlewareErrorContext<TContext = any, TArgs = any> = {
  root: any;
  args: TArgs;
  context: TContext;
  info: GraphQLResolveInfo;
};

export type YupMiddlewareOptions = {
  errorPayloadBuilder?: (
    error: ValidationError,
    errorContext: YupMiddlewareErrorContext,
  ) => Object;
  shouldTransformArgs?: boolean;
  yupOptions?: ValidateOptions;
};

export type YupMiddlewareFieldValidationError = {
  field: string;
  errors: string[];
};

export type YupMiddlewareDefaultError = {
  message: string;
  details: YupMiddlewareFieldValidationError[];
};

export interface GraphQLExtensionsYup<
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
