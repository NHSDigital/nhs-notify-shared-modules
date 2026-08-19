import { calculateJwkThumbprint, exportJWK } from 'jose';
import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import { type JWKJson, Key } from './jwk-key';

/**
 * Lightweight replacement for node-jose's `JWK.KeyStore`.
 *
 * Provides `add`, `all`, and `generate` with the same signatures used in this
 * codebase.  Keys are stored in an in-memory array.
 */
export class KeyStore {
  private readonly _keys: Key[] = [];

  /** Add an existing Key to the store. */
  add(key: Key): void {
    this._keys.push(key);
  }

  /** Return a shallow copy of all keys in the store. */
  all(): Key[] {
    return [...this._keys];
  }

  /**
   * Generate a new RSA key, add it to the store, and return it.
   *
   * @param _type   Key type – only `'RSA'` is used in this codebase.
   * @param bits    Key size in bits (e.g. 4096).
   * @param options Optional JWK metadata (`kid`, `use`, `alg`, …).  When `kid` is
   *                omitted a SHA-256 JWK thumbprint is calculated automatically.
   */
  async generate(
    _type: string,
    bits: number,
    options: Record<string, string> = {},
  ): Promise<Key> {
    const { privateKey: nodePrivateKey } = generateKeyPairSync('rsa', {
      modulusLength: bits,
    });

    const pem = nodePrivateKey.export({
      type: 'pkcs8',
      format: 'pem',
    }) as string;

    // The re-import step is necessary to get a JWK with the correct fields populated for thumbprint calculation.
    // Without this, the exported JWK is missing the `kid` field
    const reImportedKey = createPrivateKey(pem);
    const jwk = await exportJWK(reImportedKey);

    const { kid: optionsKid, ...restOptions } = options;
    const kid = optionsKid ?? (await calculateJwkThumbprint(jwk));

    const finalJwk: JWKJson = { ...jwk, ...restOptions, kid };

    const key = new Key(finalJwk, pem);
    this._keys.push(key);
    return key;
  }
}
