import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt.config';

/**
 * Generate a test JWT token for a user
 * @param userId The user ID to include in the token
 * @returns A JWT token
 */
export const generateTestToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    jwtConfig.accessToken.secret as Secret,
    {
      expiresIn: jwtConfig.accessToken.expiresIn,
    } as SignOptions,
  );
};
