import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql';

export const FieldValidationErrorType = new GraphQLObjectType({
  name: 'FieldValidationError',
  fields: {
    field: { type: new GraphQLNonNull(GraphQLString) },
    errors: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString)),
      ),
    },
  },
});

export const FieldValidationError = `
  type FieldValidationError {
    field: String!
    errors: [String!]!
  }
`;
