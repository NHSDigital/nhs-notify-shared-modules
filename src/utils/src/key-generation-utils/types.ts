export type KeyJson = {
  kid: string;
  kty: string;
  use: string;
  alg: string;
  e: string;
  n: string;
};

export type KeyStoreJson = {
  keys: KeyJson[];
};

export type RSAPublicKey = {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
};

export type RSAPublicKeystore = {
  keys: RSAPublicKey[];
};
