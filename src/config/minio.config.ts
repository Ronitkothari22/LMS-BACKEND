import { S3Client } from '@aws-sdk/client-s3';

export const minioClient = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1', // MinIO ignores region but AWS SDK requires it
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'YourStrongPass123',
  },
  forcePathStyle: true, // Required for MinIO
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'joining-dots-content';
