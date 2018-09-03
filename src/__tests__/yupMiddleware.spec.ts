import { graphql } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import { makeExecutableSchema } from 'graphql-tools';
import * as yup from 'yup';

import yupMiddleware from '../yupMiddleware';
import { FieldValidationError } from '../FieldValidationErrorType';
import { MutationValidationError } from '../MutationValidationErrorType';
import { YupMiddlewareErrorContext } from '../types';

// got it throwing a dice 🎲
const randomId = 3;

const getDefaultSchema = <TSource = any, TArgs = Object>(
  validationSchema?: yup.Schema<TArgs>,
) => {
  const typeDefs = `
    type User {
      id: Int!
      firstName: String!
      lastName: String!
      age: Int!
    }
    type AddUserPayload {
      error: String
      user: User
    }
    type AddUserPayloadWithErrorObject {
      error: MutationValidationError
      user: User
    }
    type AddUserPayloadWithErrorCustom {
      errors: [String!]
      user: User
    }
    type Mutation {
      AddUser(firstName: String!, lastName: String!, age: Int!): AddUserPayload!
      AddUserErrorObject(firstName: String!, lastName: String!, age: Int!): AddUserPayloadWithErrorObject!
      AddUserErrorCustom(firstName: String!, lastName: String!, age: Int!): AddUserPayloadWithErrorCustom!
      AddUserWithOptions(firstName: String!, lastName: String!, age: Int!): AddUserPayload!
    }
    type Query {
      hello: String!
    }
  `;

  const AddUser = {
    validationSchema,
    resolve: (_: TSource, args: TArgs) => {
      return {
        user: {
          ...(args as Object),
          id: randomId,
        },
      };
    },
  };

  const resolvers = {
    Mutation: {
      AddUser,
      AddUserErrorObject: AddUser,
      AddUserErrorCustom: AddUser,
      AddUserWithOptions: {
        ...AddUser,
        validationOptions: {
          yupOptions: {
            abortEarly: true,
          },
        },
      },
    },
    Query: {
      hello: () => 'world',
    },
  };

  return makeExecutableSchema({
    typeDefs: [typeDefs, MutationValidationError, FieldValidationError],
    resolvers,
  });
};

const defaultQuery = `
  mutation AddUser($firstName: String!, $lastName: String!, $age: Int!) {
    AddUser(firstName: $firstName, lastName: $lastName, age: $age) {
      error
      user {
        id
        firstName
        lastName
        age
      }
    }
  }
`;

const defaultQueryErrorObject = `
  mutation AddUser($firstName: String!, $lastName: String!, $age: Int!) {
    AddUserErrorObject(firstName: $firstName, lastName: $lastName, age: $age) {
      error {
        message
        details {
          field
          errors
        }
      }
      user {
        id
        firstName
        lastName
        age
      }
    }
  }
`;

const defaultQueryErrorCustom = `
  mutation AddUser($firstName: String!, $lastName: String!, $age: Int!) {
    AddUserErrorCustom(firstName: $firstName, lastName: $lastName, age: $age) {
      errors
      user {
        id
        firstName
        lastName
        age
      }
    }
  }
`;

const defaultQueryWithOptions = `
  mutation AddUser($firstName: String!, $lastName: String!, $age: Int!) {
    AddUserWithOptions(firstName: $firstName, lastName: $lastName, age: $age) {
      error
      user {
        id
        firstName
        lastName
        age
      }
    }
  }
`;

const customErrorPayloadBuilder = (
  error: yup.ValidationError,
  errorContext: YupMiddlewareErrorContext,
) => {
  const reduceErrors = (error: yup.ValidationError): string[] =>
    error.inner.reduce(
      (acc, innerError) => [...acc, ...reduceErrors(innerError)],
      [error.message],
    );
  return {
    errors: reduceErrors(error),
  };
};

it('should validate correctly - string error - error', async () => {
  const schema = getDefaultSchema(
    yup.object().shape({
      firstName: yup
        .string()
        .trim()
        .min(1),
      lastName: yup
        .string()
        .trim()
        .min(1),
      age: yup
        .number()
        .min(18)
        .max(100),
    }),
  );

  const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());

  const res = await graphql(schemaWithMiddleware, defaultQuery, null, null, {
    firstName: '',
    lastName: '',
    age: 10,
  });

  expect(res).toMatchSnapshot();
});

it('should validate correctly - string error - pass', async () => {
  const schema = getDefaultSchema(
    yup.object().shape({
      firstName: yup
        .string()
        .trim()
        .min(1),
      lastName: yup
        .string()
        .trim()
        .min(1),
      age: yup
        .number()
        .min(18)
        .max(100),
    }),
  );

  const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());

  const res = await graphql(schemaWithMiddleware, defaultQuery, null, null, {
    firstName: 'Jon',
    lastName: 'Doe',
    age: 18,
  });

  expect(res).toMatchSnapshot();
});

it('should validate correctly - object error - error', async () => {
  const schema = getDefaultSchema(
    yup.object().shape({
      firstName: yup
        .string()
        .trim()
        .min(1),
      lastName: yup
        .string()
        .trim()
        .min(1),
      age: yup
        .number()
        .min(18)
        .max(100),
    }),
  );

  const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());

  const res = await graphql(
    schemaWithMiddleware,
    defaultQueryErrorObject,
    null,
    null,
    {
      firstName: '',
      lastName: '',
      age: 10,
    },
  );

  expect(res).toMatchSnapshot();
});

it('should validate correctly - object error - pass', async () => {
  const schema = getDefaultSchema(
    yup.object().shape({
      firstName: yup
        .string()
        .trim()
        .min(1),
      lastName: yup
        .string()
        .trim()
        .min(1),
      age: yup
        .number()
        .min(18)
        .max(100),
    }),
  );

  const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());

  const res = await graphql(
    schemaWithMiddleware,
    defaultQueryErrorObject,
    null,
    null,
    {
      firstName: 'Jon',
      lastName: 'Doe',
      age: 18,
    },
  );

  expect(res).toMatchSnapshot();
});

it('should validate correctly - custom error - error', async () => {
  const schema = getDefaultSchema(
    yup.object().shape({
      firstName: yup
        .string()
        .trim()
        .min(1),
      lastName: yup
        .string()
        .trim()
        .min(1),
      age: yup
        .number()
        .min(18)
        .max(100),
    }),
  );

  const schemaWithMiddleware = applyMiddleware(
    schema,
    yupMiddleware({
      errorPayloadBuilder: customErrorPayloadBuilder,
    }),
  );

  const res = await graphql(
    schemaWithMiddleware,
    defaultQueryErrorCustom,
    null,
    null,
    {
      firstName: '',
      lastName: '',
      age: 10,
    },
  );

  expect(res).toMatchSnapshot();
});

it('should validate correctly - custom error - pass', async () => {
  const schema = getDefaultSchema(
    yup.object().shape({
      firstName: yup
        .string()
        .trim()
        .min(1),
      lastName: yup
        .string()
        .trim()
        .min(1),
      age: yup
        .number()
        .min(18)
        .max(100),
    }),
  );

  const schemaWithMiddleware = applyMiddleware(
    schema,
    yupMiddleware({
      errorPayloadBuilder: customErrorPayloadBuilder,
    }),
  );

  const res = await graphql(
    schemaWithMiddleware,
    defaultQueryErrorCustom,
    null,
    null,
    {
      firstName: 'Jon',
      lastName: 'Doe',
      age: 18,
    },
  );

  expect(res).toMatchSnapshot();
});

it('should do nothing if there are no validation schema', async () => {
  const schema = getDefaultSchema();

  const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());

  const res = await graphql(schemaWithMiddleware, defaultQuery, null, null, {
    firstName: 'J',
    lastName: 'D',
    age: 10,
  });

  expect(res.data).toBeDefined();
  expect(res.data!.AddUser.error).toBeNull();
  expect(res.data!.AddUser.user.id).toBe(randomId);
});

it('should give error if not using middleware correctly', async () => {
  const schema = getDefaultSchema();

  // @ts-ignore
  const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware);

  const res = await graphql(schemaWithMiddleware, defaultQuery, null, null, {
    firstName: '',
    lastName: '',
    age: 10,
  });

  expect(res.errors).toMatchSnapshot();
});

describe('Options', () => {
  it('should transform args only when specified', async () => {
    const schema = () =>
      getDefaultSchema(
        yup.object().shape({
          firstName: yup
            .string()
            .trim()
            .min(1),
          lastName: yup
            .string()
            .trim()
            .min(1),
          age: yup
            .number()
            .min(18)
            .max(100),
        }),
      );

    const schemaWithMiddleware1 = applyMiddleware(
      schema(),
      yupMiddleware({
        shouldTransformArgs: false,
      }),
    );

    const schemaWithMiddleware2 = applyMiddleware(
      schema(),
      yupMiddleware({
        shouldTransformArgs: true,
      }),
    );

    const variables = {
      firstName: ' Jon ',
      lastName: ' Doe ',
      age: 18,
    };

    const res1 = await graphql(
      schemaWithMiddleware1,
      defaultQuery,
      null,
      null,
      variables,
    );
    expect(res1).toMatchSnapshot();

    const res2 = await graphql(
      schemaWithMiddleware2,
      defaultQuery,
      null,
      null,
      variables,
    );
    expect(res2).toMatchSnapshot();
  });

  it('should forward yup options correctly', async () => {
    const schema = getDefaultSchema(
      yup.object().shape({
        firstName: yup
          .string()
          .trim()
          .min(1),
        lastName: yup
          .string()
          .trim()
          .min(1),
        age: yup
          .number()
          .min(18)
          .max(100),
      }),
    );

    const schemaWithMiddleware = applyMiddleware(
      schema,
      yupMiddleware({
        yupOptions: {
          abortEarly: true,
        },
      }),
    );

    const res = await graphql(schemaWithMiddleware, defaultQuery, null, null, {
      firstName: '',
      lastName: '',
      age: 10,
    });

    expect(res).toMatchSnapshot();
  });

  it('should use validationOptions from mutation definition if present', async () => {
    const schema = getDefaultSchema(
      yup.object().shape({
        firstName: yup
          .string()
          .trim()
          .min(1),
        lastName: yup
          .string()
          .trim()
          .min(1),
        age: yup
          .number()
          .min(18)
          .max(100),
      }),
    );

    const schemaWithMiddleware = applyMiddleware(schema, yupMiddleware());

    const res = await graphql(
      schemaWithMiddleware,
      defaultQueryWithOptions,
      null,
      null,
      {
        firstName: '',
        lastName: '',
        age: 10,
      },
    );

    expect(res).toMatchSnapshot();
  });
});
