import { Key, KeyStore } from '../../key-generation-utils';

describe('KeyStore', () => {
  it('can add multiple keys', () => {
    const store = new KeyStore();
    const key1 = Key.fromJWK({ kty: 'EC', x: 'a' });
    const key2 = Key.fromJWK({ kty: 'EC', x: 'b' });

    store.add(key1);
    store.add(key2);

    expect(store.all()).toHaveLength(2);
    expect(store.all()[0]).toBe(key1);
    expect(store.all()[1]).toBe(key2);
  });

  it('generates a key and adds it to the store', async () => {
    const store = new KeyStore();

    const key = await store.generate('RSA', 2048);
    const jwk = key.toJSON();

    expect(key).toBeInstanceOf(Key);
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0]).toBe(key);

    expect(jwk.kid).toBeDefined();
    expect(key.toPEM()).toContain('-----BEGIN');
  });
});
