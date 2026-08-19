import {
  Parameter,
  ParameterNotFound,
  ParameterType,
} from '@aws-sdk/client-ssm';
import { ParameterStore, ParameterStoreCache } from '../../ssm-utils';

const mockReleaser = jest.fn();
const mockAcquireLock = () => mockReleaser;
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockSetAll = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../in-memory-cache', () => ({
  InMemoryCache: jest.fn().mockImplementation(() => ({
    acquireLock: mockAcquireLock,
    get: mockGet,
    set: mockSet,
    setAll: mockSetAll,
    delete: mockDelete,
  })),
}));

const parameterStore = new ParameterStoreCache();
const param = (name: string, value: string, version = 1): Parameter => ({
  Name: name,
  Value: value,
  Version: version,
});

const undefinedParam = undefined as unknown as Parameter;

const firstMyParamName = '/comms/myParams/one';
const firstMyParam = param(firstMyParamName, 'some value for me one');

const secondMyParamName = '/comms/myParams/two';
const secondMyParam = param(secondMyParamName, 'some value for me two', 3);

const firstYourParamName = '/comms/yourParams/one';
const firstYourParam = param(firstYourParamName, 'some value for you one');

const mockGetParamFromSourceSpy = jest.spyOn(
  ParameterStore.prototype,
  'getParameter',
);
const mockGetAllParamsFromSourceSpy = jest.spyOn(
  ParameterStore.prototype,
  'getAllParameters',
);
const mockAddParamToSourceSpy = jest.spyOn(
  ParameterStore.prototype,
  'addParameter',
);
const mockDeleteParamFromSourceSpy = jest.spyOn(
  ParameterStore.prototype,
  'deleteParameter',
);

describe('ParameterStoreCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getParameter', () => {
    describe('When the cache is empty', () => {
      test('returns the param from source', async () => {
        mockGetParamFromSourceSpy.mockResolvedValue(firstMyParam);

        const parameter = await parameterStore.getParameter(
          '/comms/myParams/one',
        );

        expect(mockGetParamFromSourceSpy).toHaveBeenCalledTimes(1);
        expect(parameter).toEqual(firstMyParam);
      });

      test('sets the retrieved param from source to cache', async () => {
        mockGetParamFromSourceSpy.mockResolvedValue(firstMyParam);

        await parameterStore.getParameter('/comms/myParams/one');

        expect(mockSet).toHaveBeenCalledWith(
          `name:${firstMyParamName}`,
          firstMyParam,
        );
      });

      test('should set param to cache if retrieved param is undefined', async () => {
        mockGetParamFromSourceSpy.mockResolvedValue(undefinedParam);

        await parameterStore.getParameter('/comms/myParams/noValue');

        expect(mockSet).toHaveBeenCalled();
      });

      test('should return undefined if retrieved param is undefined', async () => {
        mockGetParamFromSourceSpy.mockResolvedValue(undefinedParam);

        const parameter = await parameterStore.getParameter(
          '/comms/myParams/noValue',
        );

        expect(parameter).toEqual(undefined);
      });

      test('should set an error in the cache when one is encountered', async () => {
        const e = new ParameterNotFound({ $metadata: {}, message: 'oops' });
        mockGetParamFromSourceSpy.mockRejectedValue(e);

        await expect(
          parameterStore.getParameter('/comms/myParams/one'),
        ).rejects.toThrow(e);
        expect(mockSet).toHaveBeenCalled();
      });
    });

    describe('When the force option is true', () => {
      test('always fetch and return param from source even if param exists in cache', async () => {
        mockGet.mockResolvedValue(firstMyParam);
        mockGetParamFromSourceSpy.mockResolvedValue(firstMyParam);

        const parameter = await parameterStore.getParameter(
          '/comms/myParams/one',
          { force: true },
        );

        expect(mockGet).not.toHaveBeenCalled();
        expect(parameter).toEqual(firstMyParam);
      });
    });

    describe('When the cache exists and when the force option is false', () => {
      test('returns the param from cache that match the parameterName', async () => {
        mockGet.mockResolvedValue(firstMyParam);

        const parameter = await parameterStore.getParameter(
          '/comms/myParams/one',
        );

        expect(mockGetParamFromSourceSpy).not.toHaveBeenCalled();
        expect(parameter).toEqual(firstMyParam);
      });

      test('returns the param from source if param is not found in cache', async () => {
        mockGet.mockResolvedValue(null);
        mockGetParamFromSourceSpy.mockResolvedValue(secondMyParam);

        const parameter = await parameterStore.getParameter(
          '/comms/myParams/two',
        );

        expect(mockGetParamFromSourceSpy).toHaveBeenCalledTimes(1);
        expect(parameter).toEqual(secondMyParam);
      });

      test('returns a cached error', async () => {
        const e = new ParameterNotFound({ $metadata: {}, message: 'oops' });
        mockGet.mockResolvedValue(e);

        await expect(
          parameterStore.getParameter('/comms/myParams/one'),
        ).rejects.toThrow(e);
        expect(mockGetParamFromSourceSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('getAllParameters', () => {
    describe('When the cache is empty', () => {
      test('returns the params from source', async () => {
        mockGetAllParamsFromSourceSpy.mockResolvedValue([firstMyParam]);

        const getAllParameters =
          await parameterStore.getAllParameters('/comms/myParams/');

        expect(mockGetAllParamsFromSourceSpy).toHaveBeenCalledTimes(1);
        expect(getAllParameters).toEqual([firstMyParam]);
      });

      test('sets the retrieved params from source to name cache and path cache', async () => {
        mockGetAllParamsFromSourceSpy.mockResolvedValue([
          firstMyParam,
          secondMyParam,
        ]);

        await parameterStore.getAllParameters('/comms/myParams/');

        const expectedCache = new Map<string, Parameter | Parameter[]>();
        expectedCache.set(`name:${firstMyParamName}`, firstMyParam);
        expectedCache.set(`name:${secondMyParamName}`, secondMyParam);
        expectedCache.set(`path:/comms/myParams/*`, [
          firstMyParam,
          secondMyParam,
        ]);

        expect(mockSetAll).toHaveBeenCalledWith(expectedCache);
      });

      test('should set param in cache if it has no value', async () => {
        const paramWithNoValue = param(firstMyParamName, '');
        mockGetAllParamsFromSourceSpy.mockResolvedValue([paramWithNoValue]);

        await parameterStore.getAllParameters('/comms/myParams/');

        const expectedCache = new Map<string, Parameter | Parameter[]>();
        expectedCache.set(`name:${firstMyParamName}`, paramWithNoValue);
        expectedCache.set(`path:/comms/myParams/*`, [paramWithNoValue]);
        expect(mockSetAll).toHaveBeenCalledWith(expectedCache);
      });

      test('sets all the retrieved params that match the pathPrefix recursivley from source to name cache and path cache', async () => {
        mockGetAllParamsFromSourceSpy.mockResolvedValue([
          firstMyParam,
          secondMyParam,
          firstYourParam,
        ]);

        await parameterStore.getAllParameters('/comms/', { recursive: true });

        const expectedCache = new Map<string, Parameter | Parameter[]>();
        expectedCache.set(`name:${firstMyParamName}`, firstMyParam);
        expectedCache.set(`name:${secondMyParamName}`, secondMyParam);
        expectedCache.set(`name:${firstYourParamName}`, firstYourParam);
        expectedCache.set(`path:/comms/**/*`, [
          firstMyParam,
          secondMyParam,
          firstYourParam,
        ]);

        expect(mockSetAll).toHaveBeenCalledWith(expectedCache);
      });
    });

    describe('When the force option is true', () => {
      test('always fetch and return params from source even if param exists in cache', async () => {
        const existingCachedParams = new Map<string, Parameter | Parameter[]>();
        existingCachedParams.set(`name:${firstMyParamName}`, firstMyParam);
        existingCachedParams.set(`path:/comms/myParams/*`, [firstMyParam]);
        mockGet.mockResolvedValue(existingCachedParams);

        mockGetAllParamsFromSourceSpy.mockResolvedValue([secondMyParam]);

        const getAllParameters = await parameterStore.getAllParameters(
          '/comms/myParams/',
          { force: true },
        );

        expect(mockGet).not.toHaveBeenCalled();
        expect(getAllParameters).toEqual([secondMyParam]);
      });
    });

    describe('When the cache exists and when the force option is false', () => {
      test('returns only the params from cache that start with the pathPrefix', async () => {
        mockGet.mockResolvedValue([firstMyParam, secondMyParam]);

        const getAllMyParameters =
          await parameterStore.getAllParameters('/comms/myParams/');

        expect(mockGet).toHaveBeenCalledWith(`path:/comms/myParams/*`);
        expect(mockGetAllParamsFromSourceSpy).not.toHaveBeenCalled();
        expect(getAllMyParameters).toEqual([firstMyParam, secondMyParam]);
      });

      test('returns all cached params that match the path prefix when recursive is true', async () => {
        mockGet.mockResolvedValue([
          firstMyParam,
          secondMyParam,
          firstYourParam,
        ]);

        const getAllMyParameters = await parameterStore.getAllParameters(
          '/comms/',
          { recursive: true },
        );

        expect(mockGet).toHaveBeenCalledWith(`path:/comms/**/*`);
        expect(mockGetAllParamsFromSourceSpy).not.toHaveBeenCalled();
        expect(getAllMyParameters).toEqual([
          firstMyParam,
          secondMyParam,
          firstYourParam,
        ]);
      });

      test('adds a trailing slash if pathPrefix is provided without one', async () => {
        mockGet.mockResolvedValue([firstMyParam, secondMyParam]);

        const getAllMyParameters =
          await parameterStore.getAllParameters('/comms/myParams');

        expect(mockGet).toHaveBeenCalledWith(`path:/comms/myParams/*`);
        expect(mockGetAllParamsFromSourceSpy).not.toHaveBeenCalled();
        expect(getAllMyParameters).toEqual([firstMyParam, secondMyParam]);
      });
    });
  });

  describe('addParameter', () => {
    test('should add the param to the source', async () => {
      mockAddParamToSourceSpy.mockResolvedValue(firstMyParam);

      await parameterStore.addParameter(
        firstMyParamName,
        firstMyParam.Value!,
        ParameterType.STRING,
        true,
      );

      expect(mockAddParamToSourceSpy).toHaveBeenCalledTimes(1);
      expect(mockAddParamToSourceSpy).toHaveBeenCalledWith(
        firstMyParamName,
        firstMyParam.Value!,
        ParameterType.STRING,
        true,
      );
    });

    test('should add the param to the cache', async () => {
      mockAddParamToSourceSpy.mockResolvedValue(firstMyParam);

      await parameterStore.addParameter(
        firstMyParamName,
        firstMyParam.Value!,
        ParameterType.STRING,
        true,
      );

      expect(mockSet).toHaveBeenCalledWith(
        `name:${firstMyParamName}`,
        firstMyParam,
      );
    });

    test('should return the added param', async () => {
      mockAddParamToSourceSpy.mockResolvedValue(firstMyParam);

      const addedParam = await parameterStore.addParameter(
        firstMyParamName,
        firstMyParam.Value!,
        ParameterType.STRING,
        true,
      );

      expect(addedParam).toEqual(firstMyParam);
    });

    test('does not cache if there was an error adding param to source', async () => {
      const e = new Error('PutParameter Error');
      mockAddParamToSourceSpy.mockRejectedValue(e);

      await expect(
        parameterStore.addParameter(firstMyParamName, firstMyParam.Value!),
      ).rejects.toThrow(e);

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('clearCachedParameter', () => {
    test('clears SSM parameter from cache if found and no version specified', async () => {
      mockGet.mockResolvedValue({ value: '12', version: 1 });

      await parameterStore.clearCachedParameter('ssm-param');

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith('name:ssm-param');
    });

    test('clears SSM parameter from cache if version matches', async () => {
      mockGet.mockResolvedValue({
        Name: 'ssm-param',
        Value: 'some-value',
        Version: 1,
      });

      await parameterStore.clearCachedParameter('ssm-param', 1);

      expect(mockDelete).toHaveBeenCalledWith('name:ssm-param');
    });

    test('does not clear from cache if cached version does not match specified version', async () => {
      mockGet.mockResolvedValue({
        Name: 'ssm-param',
        Value: 'some-value',
        Version: 2,
      });

      await parameterStore.clearCachedParameter('ssm-param', 1);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('deleteParameter', () => {
    test('deletes the parameter from the source', async () => {
      mockDeleteParamFromSourceSpy.mockResolvedValue();

      await parameterStore.deleteParameter('ssm-param');

      expect(mockDeleteParamFromSourceSpy).toHaveBeenCalledTimes(1);
      expect(mockDeleteParamFromSourceSpy).toHaveBeenCalledWith('ssm-param');
    });

    test('deletes the parameter from the cache', async () => {
      mockDeleteParamFromSourceSpy.mockResolvedValue();

      await parameterStore.deleteParameter('ssm-param');

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith('name:ssm-param');
    });

    test('does not delete from cache if ssm delete fails', async () => {
      const e = new Error('DeleteError');
      mockDeleteParamFromSourceSpy.mockRejectedValue(e);

      await expect(
        parameterStore.deleteParameter(firstMyParamName),
      ).rejects.toThrow(e);

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
