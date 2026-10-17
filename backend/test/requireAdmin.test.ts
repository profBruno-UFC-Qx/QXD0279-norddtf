import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { entrarComo } from './entrarComo.js';

const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };

describe('proteção das rotas de admin', () => {
  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).get('/admin/qualquer');

    expect(resposta.status).toBe(401);
  });

  it('responde 403 ACESSO_NEGADO para cliente em qualquer método e caminho sob /admin', async () => {
    const { agent } = await entrarComo('USER');

    const respostas = [
      await agent.get('/admin'),
      await agent.get('/admin/qualquer'),
      await agent.post('/admin/qualquer').send({}),
      await agent.delete('/admin/qualquer/1'),
    ];

    for (const resposta of respostas) {
      expect(resposta.status).toBe(403);
      expect(resposta.body).toEqual(ACESSO_NEGADO);
    }
  });

  it('deixa o admin passar, e um caminho sem rota responde 404', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.get('/admin/qualquer');

    expect(resposta.status).toBe(404);
  });

  it('responde 401 para a sessão de um usuário que não existe mais', async () => {
    const { agent, id } = await entrarComo('USER');
    await db.orm.public.User.where({ id }).delete();

    const resposta = await agent.get('/admin/qualquer');

    expect(resposta.status).toBe(401);
  });
});
