import cloudinary from '../config/cloudinary.config';
import { ContentType } from '@prisma/client';
import logger from '../config/logger.config';
import { Readable } from 'stream';

/**
 * Upload a file to Cloudinary with optimizations for large files
 * @param file - The file buffer to upload
 * @param folder - The folder to upload to (e.g., 'sessions/123/content')
 * @param contentType - The type of content (IMAGE, PDF, TEXT, VIDEO, DOCUMENT)
 * @param originalName - The original filename to preserve extension
 * @param onProgress - Optional progress callback function
 * @returns The Cloudinary upload result
 */
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  [key: string]: any;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const uploadToCloudinary = async (
  file: Buffer,
  folder: string,
  contentType: ContentType,
  originalName?: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<CloudinaryUploadResult> => {
  try {
    // Set resource type based on content type
    let resourceType: 'auto' | 'video' | 'image' | 'raw' = 'auto';
    if (contentType === 'VIDEO') {
      resourceType = 'video';
    } else if (contentType === 'IMAGE') {
      resourceType = 'image';
    } else if (contentType === 'PDF') {
      resourceType = 'raw';
    } else if (contentType === 'TEXT') {
      resourceType = 'raw';
    } else if (contentType === 'DOCUMENT') {
      resourceType = 'raw';
    }

    // Prepare upload options with optimizations
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      // Optimizations for large files
      chunk_size: 6000000, // 6MB chunks
      timeout: 120000, // 2 minutes timeout
      eager_async: true, // Process transformations asynchronously
      // Enable progress tracking if callback provided
      ...(onProgress && {
        progress: (bytesUploaded: number, totalBytes: number) => {
          onProgress({
            loaded: bytesUploaded,
            total: totalBytes,
            percentage: Math.round((bytesUploaded / totalBytes) * 100),
          });
        },
      }),
    };

    // For documents, add special handling to preserve format and enable proper downloads
    if (contentType === 'DOCUMENT' && originalName) {
      const extension = originalName.split('.').pop()?.toLowerCase();
      if (extension) {
        uploadOptions.use_filename = true;
        uploadOptions.unique_filename = true;
        uploadOptions.format = extension; // Preserve original format

        // Add transformation for proper content disposition for all document types
        if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(extension)) {
          uploadOptions.flags = 'attachment';
        }
      }
    }

    // For PDFs, preserve filename and set attachment flag
    if (contentType === 'PDF' && originalName) {
      uploadOptions.use_filename = true;
      uploadOptions.unique_filename = true;
      uploadOptions.flags = 'attachment';
    }

    // For all file types, try to preserve the original filename
    if (originalName && !uploadOptions.use_filename) {
      uploadOptions.use_filename = true;
      uploadOptions.unique_filename = true;
    }

    logger.info(
      `Starting upload to Cloudinary - Size: ${(file.length / 1024 / 1024).toFixed(2)}MB, Type: ${contentType}`,
    );

    // Upload to Cloudinary with retry logic
    const result = await uploadWithRetry(file, uploadOptions, 3);

    logger.info(
      `Upload completed successfully - Public ID: ${result.public_id}, Size: ${(result.bytes / 1024 / 1024).toFixed(2)}MB`,
    );

    return result;
  } catch (error) {
    logger.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload with retry logic for better reliability
 */
async function uploadWithRetry(
  file: Buffer,
  uploadOptions: any,
  maxRetries: number,
): Promise<CloudinaryUploadResult> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Upload attempt ${attempt}/${maxRetries}`);

      const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        });

        // Convert buffer to stream and pipe to uploadStream
        const bufferStream = Readable.from(file);
        bufferStream.pipe(uploadStream);
      });

      return result; // Success!
    } catch (error) {
      lastError = error;
      logger.warn(`Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        logger.info(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError; // All retries failed
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param contentType - The type of content (IMAGE, PDF, TEXT, VIDEO)
 * @returns The Cloudinary deletion result
 */
interface CloudinaryDeleteResult {
  result: string;
  [key: string]: any;
}

export const deleteFromCloudinary = async (
  publicId: string,
  contentType: ContentType,
): Promise<CloudinaryDeleteResult> => {
  try {
    // Set resource type based on content type
    let resourceType: 'image' | 'video' | 'raw' = 'raw'; // Default to raw
    if (contentType === 'VIDEO') {
      resourceType = 'video';
    } else if (contentType === 'IMAGE') {
      resourceType = 'image';
    } // PDF, TEXT, and DOCUMENT all use 'raw' (default)

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return result;
  } catch (error) {
    logger.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};
