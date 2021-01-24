import * as express from 'express';
import { graphqlHTTP } from 'express-graphql';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { applyMiddleware } from 'graphql-middleware';
import * as yup from 'yup';
import {
  MutationValidationErrorType,
  yupMiddleware,
} from 'graphql-yup-middleware';

// Construct a schema

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hello: {
      type: GraphQLNonNull(GraphQLString),
      resolve: () => 'world',
    },
  },
});

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      extensions: {
        yupMiddleware: {
          validationSchema: yup.object({
            name: yup.string().required().min(12),
          }),
        },
      },
      args: {
        name: {
          type: GraphQLNonNull(GraphQLString),
        },
      },
      type: new GraphQLObjectType({
        name: 'AddUserPayload',
        fields: {
          error: {
            type: MutationValidationErrorType,
          },
        },
      }),
    },
  },
});

const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

const app = express();
app.use(
  '/graphql',
  graphqlHTTP({
    schema: applyMiddleware(schema, yupMiddleware()),
    graphiql: true,
  }),
);
app.listen(3000);
console.log('Running a GraphQL API server at http://localhost:3000/graphql');
