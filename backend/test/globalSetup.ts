import { execFileSync } from 'node:child_process';
import { DeleteObjectsCommand, HeadBucketCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import pg from 'pg';
import { getTestDatabase } from './testDatabase.js';

function adminUrl(url: string) {
  const admin = new URL(url);
  admin.pathname = '/postgres';
  return admin.toString();
}

function clienteS3() {
  return new S3Client({
    endpoint: process.env['S3_ENDPOINT']!,
    region: process.env['S3_REGION']!,
    credentials: {
      accessKeyId: process.env['S3_ACCESS_KEY_ID']!,
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY']!,
    },
    forcePathStyle: true,
  });
}

function bucketDeTeste() {
  const bucket = process.env['S3_BUCKET_TEST'];
  if (!bucket?.endsWith('-test') || bucket === process.env['S3_BUCKET']) {
    throw new Error(`S3_BUCKET_TEST aponta para "${bucket ?? ''}". O nome precisa terminar em -test e ser diferente de S3_BUCKET, porque os testes apagam tudo o que está nele.`);
  }
  return bucket;
}

async function conferirBucket(s3: S3Client, bucket: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (erro) {
    throw new Error('Garage fora do ar ou sem o bucket de teste: suba com docker compose up -d garage e rode pnpm garage:iniciar.', { cause: erro });
  }
}

async function esvaziarBucket(s3: S3Client, bucket: string) {
  let continuacao: string | undefined;
  do {
    const pagina = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuacao }));
    const objetos = (pagina.Contents ?? []).map(({ Key }) => ({ Key }));
    if (objetos.length > 0) {
      await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objetos } }));
    }
    continuacao = pagina.NextContinuationToken;
  } while (continuacao);
}

export default async function setup() {
  const { url, name } = getTestDatabase();
  const bucket = bucketDeTeste();
  const s3 = clienteS3();

  await conferirBucket(s3, bucket);

  const admin = new pg.Client({ connectionString: adminUrl(url) });

  await admin.connect();

  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);

    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await admin.end();
  }

  try {
    execFileSync('pnpm', ['prisma', 'db', 'init'], {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'pipe',
    });
  } catch (error) {
    throw new Error(`Falha ao aplicar o schema no banco de teste:\n${(error as { stdout?: Buffer }).stdout}`);
  }

  return async function teardown() {
    try {
      await esvaziarBucket(s3, bucket);
    } finally {
      const client = new pg.Client({ connectionString: adminUrl(url) });

      await client.connect();

      try {
        await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      } finally {
        await client.end();
      }
    }
  };
}
