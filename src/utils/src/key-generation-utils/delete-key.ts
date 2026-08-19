import { logger } from '../logger';
import { parameterStore } from '../ssm-utils';

type DeleteKeyParams = {
  Name: string;
  deleteReason: string;
  warn: boolean;
};

export const deleteKey = async ({
  Name,
  deleteReason,
  warn,
}: DeleteKeyParams) => {
  await parameterStore.deleteParameter(Name);
  // eslint-disable-next-line unicorn/no-negated-condition
  if (!warn) {
    logger.info({
      description: `Keygen deleted private key ${Name}: ${deleteReason}`,
    });
  } else {
    logger.warn({
      description: `Keygen deleted invalid private key ${Name}: ${deleteReason}`,
    });
  }
};
