import { ValidationError } from 'yup';

import groupBy = require('lodash.groupby');

import {
  YupMiddlewareErrorContext,
  YupMiddlewareDefaultError,
  YupMiddlewareFieldValidationError,
} from './types';

export default function buildErrorObjectFromValidationError(
  error: ValidationError,
  _errorContext: YupMiddlewareErrorContext,
): { error: YupMiddlewareDefaultError } {
  let rootError: YupMiddlewareDefaultError = {
    message: error.message,
    details: [],
  };

  if (error.inner.length) {
    const errorsGrouped = groupBy(error.inner, 'path');

    const details = Object.keys(errorsGrouped).reduce(
      (acc: YupMiddlewareFieldValidationError[], key) => [
        ...acc,
        {
          field: key,
          errors: errorsGrouped[key].map((fieldError) => fieldError.message),
        },
      ],
      [],
    );

    rootError = {
      ...rootError,
      details,
    };
  }

  return {
    error: rootError,
  };
}
