import { isBefore, subDays } from 'date-fns';
import {
  NonNullSSMParam,
  createKeyStore,
  deleteKey,
  generateNewKey,
  logger,
  nonNullParameterFilter,
  parameterStore,
  uploadPublicKeystoreToS3,
  validatePrivateKey,
} from 'utils';
import { loadConfig } from 'config';

type DeleteInvalidKeysAndCreateKeystoreParams = {
  ssmPath: string;
  minIssueDate: Date;
  now: Date;
};

const deleteInvalidKeysAndCreateKeystore = async ({
  minIssueDate,
  now,
  ssmPath,
}: DeleteInvalidKeysAndCreateKeystoreParams) => {
  const keystore = createKeyStore();
  let youngestKeyDate: Date | null = null;

  const allParams = await parameterStore.getAllParameters(ssmPath);
  const keyParams = allParams.filter((p: any): p is NonNullSSMParam =>
    nonNullParameterFilter(p),
  );

  for (const { Name, Value } of keyParams) {
    const validationResult = await validatePrivateKey({
      Name,
      Value,
      minIssueDate,
      now,
    });
    if (validationResult.valid) {
      const { keyDate, keyJwk } = validationResult;
      await keystore.add(keyJwk);
      // track the date of the youngest private key to determine rotation
      if (!youngestKeyDate || isBefore(youngestKeyDate, keyDate)) {
        youngestKeyDate = keyDate;
      }
    } else {
      const { deleteReason, warn = false } = validationResult;

      await deleteKey({
        Name,
        deleteReason,
        warn,
      });
    }
  }

  logger.info({
    description: `Read ${keystore.all().length} keys from SSM Parameter store.`,
  });

  return { keystore, youngestKeyDate };
};

export const cleanAndRefreshKeystores = async ({
  maxAgeDays = 56,
  minDaysBeforeRotation = 28,
  now = new Date(),
}) => {
  const config = loadConfig();

  // date beyond which keys should be deleted
  const minIssueDate = subDays(now, maxAgeDays);
  // most recent date beyond which we should gen a new key
  const keygenThresholdDate = subDays(now, minDaysBeforeRotation);

  const ssmPath = config.pemSSMPath;
  const { keystore, youngestKeyDate } =
    await deleteInvalidKeysAndCreateKeystore({
      ssmPath,
      minIssueDate,
      now,
    });

  if (!youngestKeyDate || isBefore(youngestKeyDate, keygenThresholdDate)) {
    await generateNewKey({
      keystore,
      ssmPath,
      now,
    });
  } else {
    logger.info({
      description: `Keystore already contains a key less than ${minDaysBeforeRotation} days old, skipping new key gen`,
    });
  }

  await uploadPublicKeystoreToS3({
    jwksFileName: config.jwksFileName,
    keystore,
    staticAssetBucket: config.staticAssetBucket,
  });

  logger.info({
    description: `Email auth keygen refresh complete: current key IDs: ${keystore
      .all()
      .map((key) => key.toJSON().kid)}`,
  });
};
