import { getTestDatabase } from './testDatabase.js';

process.env['DATABASE_URL'] = getTestDatabase().url;
process.env['SESSION_SECRET'] = 'test-session-secret';
