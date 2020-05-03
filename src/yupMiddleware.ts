import { ValidationError } from 'yup';
import {
  GraphQLString,
  GraphQLObjectType,
  isObjectType,
  GraphQLNonNull,
  GraphQLResolveInfo,
} from 'graphql';
import { IMiddleware } from 'graphql-middleware';

import './graphql.augmented';
import buildErrorObjectFromValidationError from './buildErrorObjectFromValidationError';
import { YupMiddlewareOptions, GraphQLExtensionsYup } from './types';
import { MutationValidationErrorType } from './MutationValidationErrorType';

const defaultOptions = {
  errorPayloadBuilder: buildErrorObjectFromValidationError,
  shouldTransformArgs: true,
  yupOptions: {
    abortEarly: false,
  },
};

export default function yupMutationMiddleware<
  TSource = any,
  TContext = any,
  TArgs = any
>(options: YupMiddlewareOptions = {}): IMiddleware<TSource, TContext, TArgs> {
  const hasSuppliedErrorPayloadBuilder = !!options.errorPayloadBuilder;
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  if (typeof options === 'function') {
    throw new TypeError(
      'You have to call the yupMutationMiddleware before adding it to the middlewares: yupMutationMiddleware()',
    );
  }

  return {
    // tslint:disable-next-line: function-name
    async Mutation(
      resolve: Function,
      root: TSource,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo,
    ) {
      const mutationField = info.schema.getMutationType();

      // this should not really happen
      if (!mutationField) {
        return;
      }

      const mutationDefinition = mutationField.getFields()[info.fieldName];

      const hasExtensionsField =
        !!mutationDefinition.extensions &&
        !!mutationDefinition.extensions.yupMiddleware;

      const mutationValidationSchema = hasExtensionsField
        ? (mutationDefinition.extensions!.yupMiddleware as GraphQLExtensionsYup<
            TSource,
            TContext,
            TArgs
          >).validationSchema
        : mutationDefinition.validationSchema;
      const mutationValidationOptions = hasExtensionsField
        ? (mutationDefinition.extensions!.yupMiddleware as GraphQLExtensionsYup<
            TSource,
            TContext,
            TArgs
          >).validationOptions
        : mutationDefinition.validationOptions;

      if (mutationValidationSchema) {
        const finalOptions = {
          ...mergedOptions,
          ...mutationValidationOptions,
        };

        const schema =
          typeof mutationValidationSchema === 'function'
            ? mutationValidationSchema(root, args, context, info)
            : mutationValidationSchema;

        try {
          const values = await schema.validate(args, {
            abortEarly: false,
            ...finalOptions.yupOptions,
          });

          return resolve(
            root,
            finalOptions.shouldTransformArgs ? values : args,
            context,
            info,
          );
        } catch (error) {
          if (error instanceof ValidationError) {
            const errorResult = finalOptions.errorPayloadBuilder(error, {
              root,
              args,
              context,
              info,
            });

            if (!hasSuppliedErrorPayloadBuilder) {
              let returnType = info.returnType;

              // non nullable
              if (info.returnType instanceof GraphQLNonNull) {
                returnType = info.returnType.ofType;
              }

              const isObjReturnType = isObjectType(returnType);

              if (!isObjReturnType) {
                throw new Error(
                  'Only mutations with object return type are supported',
                );
              }

              // returnType cannot be anything else at this point
              const fields = (returnType as GraphQLObjectType).getFields();

              if (!fields.error) {
                throw new Error(
                  'You must have an error field on the payload of your mutation when using default error builder',
                );
              }

              if (fields.error && fields.error.type === GraphQLString) {
                return {
                  error: error.message,
                };
              }

              if (!isObjectType(fields.error.type)) {
                throw new Error(
                  'Mutation payload error field must be of type GraphQLString or GraphQLObjectType',
                );
              }

              // @TODO Improve this validation
              if (fields.error.type.name !== MutationValidationErrorType.name) {
                throw new Error(
                  'Mutation payload error must be of type MutationValidationErrorType if using default options',
                );
              }
            }

            return errorResult;
          } else {
            throw error;
          }
        }
      }

      return resolve(root, args, context, info);
    },
  };
}
