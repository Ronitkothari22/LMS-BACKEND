import { minioClient, MINIO_BUCKET } from '../config/minio.config';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const uploadToMinIO = async (
  file: Buffer,
  key: string,
  contentType: string,
): Promise<{ url: string; key: string }> => {
  await minioClient.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return {
    url: `${process.env.MINIO_ENDPOINT}/${MINIO_BUCKET}/${key}`,
    key,
  };
};

export const deleteFromMinIO = async (key: string): Promise<void> => {
  await minioClient.send(
    new DeleteObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
    }),
  );
};
