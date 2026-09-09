import { exportJWK } from 'jose';
import { createPrivateKey } from 'node:crypto';

export type JWKJson = Record<string, unknown>;

/** Private fields that must be stripped when producing a public JWK. */
const PRIVATE_JWK_FIELDS = new Set(['d', 'dp', 'dq', 'k', 'p', 'q', 'qi']);

/**
 * Lightweight replacement for node-jose's `JWK.Key`.
 *
 * Stores the raw private PEM (when available) alongside the exported JWK so that
 * `toJSON()` (public JWK) and `toPEM()` (private PEM) can be served cheaply without
 * keeping a live crypto object in memory on the long path.
 */
export class Key {
  /** The full JWK representation of this key (may contain private key material). */
  private readonly _jwk: JWKJson;

  /** Original PEM string used to import this key, if available. */
  private readonly _privatePem: string | null;

  constructor(jwk: JWKJson, privatePem: string | null) {
    this._jwk = jwk;
    this._privatePem = privatePem;
  }

  /**
   * Create a Key from a PEM-encoded private key string and a specified key ID (kid).
   * Throws an error with a stable message when the PEM cannot be parsed,
   * matching the behaviour callers expect.
   */
  static async fromPemAndKid(kid: string, pem: string): Promise<Key> {
    try {
      const nodeKey = createPrivateKey(pem);
      const jwk = await exportJWK(nodeKey);
      return new Key({ ...jwk, kid }, pem);
    } catch {
      throw new Error('Invalid PEM formatted message.');
    }
  }

  /** Create a Key from an already-parsed public JWK object (no private material). */
  static fromJWK(jwk: JWKJson): Key {
    return new Key(jwk, null);
  }

  /**
   * Returns the *public* JWK representation of this key (private key fields are
   * stripped), matching the default behaviour of node-jose's `key.toJSON()`.
   */
  toJSON(): JWKJson {
    return Object.fromEntries(
      Object.entries(this._jwk).filter(
        ([field]) => !PRIVATE_JWK_FIELDS.has(field),
      ),
    );
  }

  /**
   * Returns the PEM encoding of the key.
   * `key.toPEM()` usage.
   */
  toPEM(): string {
    if (!this._privatePem) {
      throw new Error('No private key PEM available on this Key instance.');
    }
    return this._privatePem;
  }
}
