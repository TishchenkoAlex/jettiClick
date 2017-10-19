import { JwtConfig } from './env/environment';
import * as expressJwt from 'express-jwt';
import * as jwksRsa from 'jwks-rsa';

export const jwtCheck = expressJwt({
  secret: (jwksRsa as any).expressJwtSecret(JwtConfig.JwtSecret),
  audience: JwtConfig.audience,
  issuer: JwtConfig.issuer,
  algorithms: JwtConfig.algorithms
});
