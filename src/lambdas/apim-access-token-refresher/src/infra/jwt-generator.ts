import type { Logger } from 'utils';
import { JwtHeader, JwtPayload } from 'jsonwebtoken';

type StringGenerator = () => string;
type Signer = (
  payload: JwtPayload,
  key: string,
  options: { header: JwtHeader },
) => string;

export class JWTGenerator {
  constructor(
    private readonly _signer: Signer,
    private readonly _uuid: StringGenerator,
    private readonly _logger: Logger,
  ) {}

  generate(
    { kid }: Pick<JwtHeader, 'kid'>,
    { aud, iss, sub }: Pick<JwtPayload, 'aud' | 'iss' | 'sub'>,
    key: string,
  ): string {
    try {
      const header: JwtHeader = {
        alg: 'RS512',
        typ: 'JWT',
        kid,
      };

      const payload: JwtPayload = {
        exp: Math.floor(Date.now() / 1000) + 5 * 60,
        jti: this._uuid(),
        iss,
        sub,
        aud,
      };

      return this._signer(payload, key, { header });
    } catch (error: unknown) {
      this._logger.error({
        description: 'Error generating signed JWT.',
        err: error,
      });

      throw new Error('Unable to generate signed JWT.');
    }
  }
}
