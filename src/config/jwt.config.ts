import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
