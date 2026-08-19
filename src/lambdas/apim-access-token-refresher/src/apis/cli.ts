import { createContainer } from 'infra/container';
import {
  type Dependencies as ApplicationDependencies,
  createApplication,
} from 'app/refresh-apim-access-token';

type CLIDependencies = Record<never, unknown>;

type Dependencies = ApplicationDependencies & CLIDependencies;

(function main(d: Dependencies) {
  const refreshApimAccessToken = createApplication(d);

  refreshApimAccessToken().catch((error: unknown) => {
    console.log(error); // eslint-disable-line no-console
  });
})(createContainer());
