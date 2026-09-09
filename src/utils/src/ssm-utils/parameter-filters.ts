/* eslint-disable sonarjs/different-types-comparison */
import { Parameter } from '@aws-sdk/client-ssm';
import { NonNullSSMParam } from './types';

export const nonNullParameterFilter = (
  param: Parameter,
): param is NonNullSSMParam =>
  param.Name !== undefined &&
  param.Value !== undefined &&
  param.Name !== null &&
  param.Value !== null;
