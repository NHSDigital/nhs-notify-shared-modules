import { ParameterType, Parameter as SSMParameter } from '@aws-sdk/client-ssm';

export type Parameter = SSMParameter;

export type GetParameterOptions = { maxAttempts?: number; force?: boolean };

export type GetAllParametersOptions = { recursive?: boolean; force?: boolean };

export interface IParameterStore {
  getParameter(
    parameterName: string,
    options?: GetParameterOptions,
  ): Promise<Parameter | undefined>;
  /**
   * Refer to implementation documentation for usage details.
   */
  getAllParameters(
    pathPrefix: string,
    options?: GetAllParametersOptions,
  ): Promise<Parameter[]>;
  addParameter: (
    parameterName: string,
    parameterValue: string,
    type?: ParameterType,
    overwrite?: boolean,
  ) => Promise<Parameter>;
  deleteParameter: (parameterName: string) => Promise<void>;
  clearCachedParameter(parameterName: string, version?: number): Promise<void>;
}

export type NonNullSSMParam = Omit<Parameter, 'Name' | 'Value'> &
  Required<Pick<Parameter, 'Name' | 'Value'>>;
