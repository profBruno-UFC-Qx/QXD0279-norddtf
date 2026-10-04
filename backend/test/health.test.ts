import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';

describe('GET /health', () => {
  it('responde 200', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });
});
