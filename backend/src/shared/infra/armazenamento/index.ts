import 'dotenv/config';
import { S3Client } from '@aws-sdk/client-s3';
import { ArmazenamentoS3 } from './ArmazenamentoS3.js';

const cliente = new S3Client({
  endpoint: process.env['S3_ENDPOINT']!,
  region: process.env['S3_REGION']!,
  credentials: {
    accessKeyId: process.env['S3_ACCESS_KEY_ID']!,
    secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']!,
  },
  forcePathStyle: true,
  requestHandler: { connectionTimeout: 3000, requestTimeout: 10000, throwOnRequestTimeout: true },
});

export const armazenamento = new ArmazenamentoS3(cliente, process.env['S3_BUCKET']!);
