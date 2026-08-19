import { type JWKJson, Key } from './jwk-key';
import { KeyStore } from './jwk-key-store';

// ---------------------------------------------------------------------------
// Factory helpers mirroring node-jose's JWK namespace
// ---------------------------------------------------------------------------

/** Create a new empty KeyStore. */
export const createKeyStore = (): KeyStore => new KeyStore();

/**
 * Import a single PEM-encoded private key.
 * the input is always treated as a PEM string.
 */
export const asKey = async (kid: string, pem: string): Promise<Key> =>
  Key.fromPemAndKid(kid, pem);

/**
 * Import a JWKS JSON object into a KeyStore.
 * Useful in tests where a static set of public JWK objects is provided.
 */
export const asKeyStore = async (json: {
  keys: JWKJson[];
}): Promise<KeyStore> => {
  const store = new KeyStore();
  for (const keyJson of json.keys) {
    store.add(Key.fromJWK(keyJson));
  }
  return store;
};
