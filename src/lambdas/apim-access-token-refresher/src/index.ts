// This is a Lambda entrypoint file.

import { createContainer } from 'infra/container';
import {
  type Dependencies as ApplicationDependencies,
  createApplication,
} from 'app/refresh-apim-access-token';

type LambdaAPIDependencies = Record<never, unknown>;

type Dependencies = ApplicationDependencies & LambdaAPIDependencies;

function createLambdaHandler(d: Dependencies) {
  const refreshApimAccessToken = createApplication(d);

  return async function lambdaHandler() {
    await refreshApimAccessToken();
  };
}

export const handler = createLambdaHandler(createContainer());
