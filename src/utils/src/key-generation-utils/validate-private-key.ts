import { isBefore, parse } from 'date-fns';
import { Key } from './jwk-key';
import { asKey } from './jwk';

type ValidatePrivateKeyParams = {
  Name: string;
  Value: string;
  minIssueDate: Date;
  now: Date;
};

export type ValidateKeyResult =
  | {
      valid: false;
      deleteReason: string;
      warn?: boolean;
    }
  | { valid: true; keyJwk: Key; keyDate: Date };

// private key param names are /riskstrat/<env>/emailauth/privatekey_<date>_<kid>.pem
const privateKeyRegex = /privatekey_(\d{8})_(.+)\.pem/;

export const validatePrivateKey = async ({
  Name,
  Value,
  minIssueDate,
  now,
}: ValidatePrivateKeyParams): Promise<ValidateKeyResult> => {
  // split date and kid out of param name
  // eslint-disable-next-line sonarjs/prefer-regexp-exec
  const [, keyDateString, keyKid] = Name?.match(privateKeyRegex) ?? [];

  if (!keyDateString || !keyKid) {
    return {
      valid: false,
      deleteReason:
        'Does not match the name format privatekey_<date>_<kid>.pem',
      warn: true,
    };
  }

  const keyDate = parse(keyDateString, 'yyyyMMdd', now);
  if (Number.isNaN(keyDate.getTime())) {
    return {
      valid: false,
      deleteReason: `'${keyDateString}' is not a valid yyyyMMdd date`,
      warn: true,
    };
  }

  if (isBefore(keyDate, minIssueDate)) {
    return {
      valid: false,
      deleteReason: `Key expired, keyDateString: ${keyDateString}`,
    };
  }

  try {
    const keyJwk = await asKey(keyKid, Value);
    return { valid: true, keyJwk, keyDate };
  } catch (error) {
    return {
      valid: false,
      deleteReason: `Could not parse pem value, ${error}`,
      warn: true,
    };
  }
};
