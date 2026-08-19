import {
  Parameter,
  ParameterNotFound,
  ParameterType,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { type ICache, InMemoryCache } from '../in-memory-cache';
import { ParameterStore } from './parameter-store';
import type {
  GetAllParametersOptions,
  GetParameterOptions,
  IParameterStore,
} from './types';

type ParameterOrError = Parameter | ParameterNotFound;

export class ParameterStoreCache
  extends ParameterStore
  implements IParameterStore
{
  private readonly cache: ICache;

  constructor(dependencies?: { client: SSMClient }, timeToLive?: number) {
    super(dependencies);
    this.cache = new InMemoryCache({ ttl: timeToLive });
  }

  async getParameter(
    parameterName: string,
    options: GetParameterOptions = {},
  ): Promise<Parameter | undefined> {
    const release = await this.cache.acquireLock();
    const key = this.getParameterNameKey(parameterName);

    if (!options.force) {
      const cached = await this.cache.get<ParameterOrError>(key);
      if (cached instanceof ParameterNotFound) {
        release();
        throw cached;
      } else if (cached) {
        release();
        return cached;
      }
    }

    let parameter;
    try {
      parameter = await super.getParameter(parameterName, options);

      await this.cache.set(key, parameter);
    } catch (error) {
      if (error instanceof ParameterNotFound) {
        await this.cache.set(key, error);
        throw error;
      }
    } finally {
      release();
    }
    return parameter;
  }

  /**
   * Returns and caches a list of parameters from SSM.
   *
   * The first call to this method will retrieve data from SSM.
   * Subsequent matching calls (i.e. with the same path prefix and recursion) will return the cached list.
   *
   * N.B Parameters retrieved when calling this method will also be cached individually for usage by getParameter.
   * But beware that updates to individual parameters (e.g. using addParameter, deleteParameter, clearCachedParameter) will not be reflected in cached lists.
   *
   * To refetch a list from source, pass the option `{ force: true }`
   *
   * @param pathPrefix
   * @param options
   * @returns
   */
  async getAllParameters(
    pathPrefix: string,
    options: GetAllParametersOptions = {},
  ): Promise<Parameter[]> {
    const release = await this.cache.acquireLock();
    const key = this.getParameterPathPrefixKey(pathPrefix, !!options.recursive);

    try {
      if (!options.force) {
        const cached = await this.cache.get<Parameter[]>(key);

        if (cached && cached.length > 0) {
          return cached;
        }
      }

      const parameters = await super.getAllParameters(pathPrefix, options);
      const map = new Map<string, Parameter | Parameter[]>();

      if (parameters.length > 0) {
        map.set(key, parameters);
      }

      for (const parameter of parameters) {
        map.set(this.getParameterNameKey(parameter.Name as string), parameter);
      }

      await this.cache.setAll(map);

      return parameters;
    } finally {
      release();
    }
  }

  async addParameter(
    parameterName: string,
    parameterValue: string,
    type: ParameterType = ParameterType.SECURE_STRING,
    overwrite = true,
  ) {
    const release = await this.cache.acquireLock();

    try {
      const parameter = await super.addParameter(
        parameterName,
        parameterValue,
        type,
        overwrite,
      );

      await this.cache.set(this.getParameterNameKey(parameterName), parameter);

      return parameter;
    } finally {
      release();
    }
  }

  async clearCachedParameter(
    parameterName: string,
    version?: number,
  ): Promise<void> {
    const release = await this.cache.acquireLock();
    const key = this.getParameterNameKey(parameterName);

    if (version) {
      const cached = await this.cache.get<ParameterOrError>(key);

      if (
        !(cached instanceof ParameterNotFound) &&
        (!cached || cached.Version !== version)
      ) {
        release();
        return;
      }
    }

    try {
      await this.cache.delete(key);
    } finally {
      release();
    }
  }

  async deleteParameter(parameterName: string): Promise<void> {
    const release = await this.cache.acquireLock();

    try {
      await super.deleteParameter(parameterName);
      await this.cache.delete(this.getParameterNameKey(parameterName));
    } finally {
      release();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private getParameterNameKey(name: string): string {
    return `name:${name}`;
  }

  // eslint-disable-next-line class-methods-use-this
  private getParameterPathPrefixKey(pathPrefix: string, recursive: boolean) {
    const santisedPathPrefix = pathPrefix.endsWith('/')
      ? pathPrefix
      : `${pathPrefix}/`;
    const key = `path:${santisedPathPrefix}`;

    if (recursive) {
      return `${key}**/*`;
    }

    return `${key}*`;
  }
}
