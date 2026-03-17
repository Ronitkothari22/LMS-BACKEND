import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.config';
import logger from './logger.config';

// Configure Cloudinary with optimizations for large files
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
  // Optimize for large file uploads
  chunk_size: 6000000, // 6MB chunks for better upload performance
  timeout: 120000, // 2 minutes timeout for large files
});

// Initialize Cloudinary
export const initCloudinary = (): void => {
  try {
    logger.info('Cloudinary initialized successfully with optimized settings');
  } catch (error) {
    logger.error('Error initializing Cloudinary:', error);
  }
};

export default cloudinary;
