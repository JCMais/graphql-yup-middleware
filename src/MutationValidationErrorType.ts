import {
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

import { FieldValidationErrorType } from './FieldValidationErrorType';

export const MutationValidationErrorType = new GraphQLObjectType({
  name: 'MutationValidationError',
  fields: {
    message: { type: new GraphQLNonNull(GraphQLString) },
    details: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(FieldValidationErrorType)),
      ),
    },
  },
});

export const MutationValidationError = `
  type MutationValidationError {
    message: String!
    details: [FieldValidationError!]!
  }
`;
