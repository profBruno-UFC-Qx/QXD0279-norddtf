import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';

describe('tratamento de erro da API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responde 400 em JSON para um corpo malformado', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ message: 'Requisição inválida.' });
  });

  it('responde 500 com a mensagem geral para um erro inesperado', async () => {
    vi.spyOn(UsersRepository.prototype, 'findByEmail').mockRejectedValueOnce(new Error('banco fora do ar'));

    const resposta = await request(app).post('/auth/login').send({ email: 'ana@x.com', senha: 'senha1234' });

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ message: 'Não foi possível concluir agora.' });
  });
});
