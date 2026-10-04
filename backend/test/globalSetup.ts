import { execFileSync } from 'node:child_process';
import pg from 'pg';
import { getTestDatabase } from './testDatabase.js';

function adminUrl(url: string) {
  const admin = new URL(url);
  admin.pathname = '/postgres';
  return admin.toString();
}

export default async function setup() {
  const { url, name } = getTestDatabase();
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
    const client = new pg.Client({ connectionString: adminUrl(url) });

    await client.connect();

    try {
      await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    } finally {
      await client.end();
    }
  };
}
