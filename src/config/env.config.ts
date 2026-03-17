import { cleanEnv, str, port, num, bool } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  DATABASE_URL: str(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  RATE_LIMIT_MAX: num({ default: 100 }),
  RATE_LIMIT_WINDOW_MS: num({ default: 15 * 60 * 1000 }), // 15 minutes
  isProduction: bool({ default: process.env.NODE_ENV === 'production' }),
  // Cloudinary configuration
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
});
