## GraphQL Mutations Validation Yup Middleware

[![npm](https://img.shields.io/npm/v/graphql-yup-middleware.svg)](https://www.npmjs.com/package/graphql-yup-middleware)
[![CircleCI (all branches)](https://img.shields.io/circleci/project/github/JCMais/graphql-yup-middleware.svg)](https://circleci.com/gh/JCMais/graphql-yup-middleware)

1. [What is this?](#what-is-this)
1. [Install](#install)
1. [Usage](#usage)

> **I have no plans to add new features to this library - It's on mainteance-only mode. When building the schema for any new GraphQL server, my recommendation is to use [nexus](https://github.com/graphql-nexus/nexus), which has native support for plugins**

### What is this?

It's a middleware to be used with [`graphql-middleware`][graphql-middleware] to add validations to mutations arguments using [`yup`][yup].

It originated from this post: https://medium.com/@jonathancardoso/graphql-mutation-arguments-validation-with-yup-using-graphql-middleware-645822fb748

### Install

```
yarn add graphql-yup-middleware
```

Keep in mind that you also need to have [`graphql`][graphql] (>= `15`), [`graphql-middleware`](graphql-middleware) (>= `6`) and [`yup`][yup] as dependencies of your project.

### Options

The `yupMutationMiddleware` function exported by this package should always
be called when adding it as middleware. Do not add it without calling first.

It accepts the following options, all are optional:

```ts
type YupMiddlewareOptions = {
  // In case of errors, this function is going to be used to build the response. More on this below.
  errorPayloadBuilder?: (
    error: ValidationError,
    errorContext: YupMiddlewareErrorContext,
  ) => Object;
  // if the values returned by yup should be merged into the args passed to the mutation resolver
  shouldTransformArgs?: boolean;
  // any options that are accepted by yup validate method
  yupOptions?: ValidateOptions;
};
```

The defaults are:

```ts
{
  shouldTransformArgs: true,
  yupOptions: {
    abortEarly: false,
  },
}
```

The default `errorPayloadBuilder` makes the following assumptions about your mutation response fields:

1. It's an object with nested fields, that is, your mutation does not return a scalar value
2. One of those is named `error`.
3. `error` field is of type `String` or `MutationValidationError`.

And it's going to create a payload based on the `error` type:

1. `String`: return `error.message` on it.
2. `MutationValidationError`: return an error object matching the following definition:

```graphql
type FieldValidationError {
  field: String!
  errors: [String!]!
}

type MutationValidationError {
  message: String!
  details: [FieldValidationError!]!
}
```

`MutationValidationError` and `FieldValidationError` are both exported as SDL, so you can add them to your typeDefs:

```ts
import {
  MutationValidationError,
  FieldValidationError,
} from 'graphql-yup-middleware';

// ...

const typeDefs = [
  MutationValidationError,
  FieldValidationError,
  /* ...your other types */
  ,
];

// ...
```

And they are also exported as `GraphQLObjectType`, in case you are building your schema manually, just append `Type` to their name.

```ts
import {
  MutationValidationErrorType,
  FieldValidationErrorType,
} from 'graphql-yup-middleware';
```

### Usage

For using it with other servers, like apollo, express, koa, etc, you are going to need to install `graphql-middleware` too:

```sh
yarn add graphql-middleware
```

Then you can apply the middleware to your schema:

```ts
import { applyMiddleware } from 'graphql-middleware';
import { yupMutationMiddleware } from 'graphql-yup-middleware';

// ... use makeExecutableSchema from apollo-tools, or build your schema yourself

const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());
```

### Setting the Validation Schema of each Mutation

For each mutation that you want to validate the args, you must define the validation schema on the definition of the mutation. This is done using the `extensions` field:

```ts
const resolvers = {
  // ...
  Mutation: {
    AddUser: {
      extensions: {
        yupMiddleware: {
          validationSchema: yupSchemaHere,
        },
      },
      resolve: async (root, args, context, info) => {
        // ...
      },
    },
  },
};
```

You can also pass another property named `validationOptions` to pass
other [options](#options) that should only be used for this mutation.

#### graphql-relay

If using the helper `mutationWithClientMutationId` from `graphql-relay`, you need to store the resulting mutation configuration to a variable, since if you try to add the `validationSchema` directly, it's not going to work (`graphql-relay` does not forward extra properties). See this issue for more details: https://github.com/graphql/graphql-relay-js/issues/244

This will not work:

```js
export default mutationWithClientMutationId({
  name: 'MyMutation',
  validationSchema: yup.object().shape({
    input: yup.object().shape({
      // ...
    }),
  }),
  mutateAndGetPayload: async (args) => {
    // ...
  },
  outputFields: {
    // ...
  },
});
```

This will:

```js
const mutation = mutationWithClientMutationId({
  name: 'MyMutation',
  mutateAndGetPayload: async (args) => {
    // ...
  },
  outputFields: {
    // ...
  },
});

export default {
  ...mutation,
  extensions: {
    ...mutation.extensions,
    yupMiddleware: {
      validationSchema: yup.object().shape({
        input: yup.object().shape({
          // ...
        }),
      }),
    },
  },
};
```

[graphql]: https://github.com/graphql/graphql-js
[graphql-middleware]: https://github.com/maticzav/graphql-middleware
[graphql-yoga]: https://github.com/prisma/graphql-yoga
[yup]: https://github.com/jquense/yup
