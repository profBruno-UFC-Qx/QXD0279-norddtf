import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';

const FRONTEND = 'http://localhost:5173';

describe('CORS', () => {
  it('expõe o Retry-After do 429 do login para o frontend', async () => {
    const email = `cors-${randomUUID()}@x.com`;
    for (let i = 0; i < 5; i++) {
      const falha = await request(app).post('/auth/login').send({ email, senha: 'errada1234' });
      expect(falha.status).toBe(401);
    }

    const resposta = await request(app)
      .post('/auth/login')
      .set('Origin', FRONTEND)
      .send({ email, senha: 'errada1234' });

    expect(resposta.status).toBe(429);
    expect(resposta.headers['retry-after']).toBeDefined();
    expect(resposta.headers['access-control-expose-headers']).toContain('Retry-After');
  });
});
