import { getTestDatabase } from './testDatabase.js';

process.env['DATABASE_URL'] = getTestDatabase().url;
process.env['SESSION_SECRET'] = 'test-session-secret';
process.env['S3_BUCKET'] = process.env['S3_BUCKET_TEST'];
