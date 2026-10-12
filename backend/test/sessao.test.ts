import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';
import { hashPassword } from '../src/shared/utils/password.js';

const SENHA = 'senha1234';
const DEZ_MINUTOS = 10 * 60 * 1000;
const QUINZE_MINUTOS = 15 * 60 * 1000;

const repository = new UsersRepository();

function setCookieDaSessao(resposta: request.Response) {
  const cabecalhos = resposta.get('Set-Cookie') ?? [];
  return cabecalhos.find((cabecalho) => cabecalho.startsWith('connect.sid='));
}

function expiracao(setCookie: string) {
  const expires = /Expires=([^;]+)/.exec(setCookie)?.[1];
  return new Date(expires ?? '').getTime();
}

async function entrar() {
  const email = `sessao-${randomUUID()}@x.com`;
  await repository.createWithPassword({ nome: 'Ana Souza', email, senhaHash: await hashPassword(SENHA) });

  const resposta = await request(app).post('/auth/login').send({ email, senha: SENHA });
  expect(resposta.status).toBe(200);

  const setCookie = setCookieDaSessao(resposta);
  expect(setCookie).toBeDefined();
  return setCookie!.split(';')[0]!;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('renovação da sessão', () => {
  it('cada requisição renova o cookie por mais 15 minutos', async () => {
    const cookie = await entrar();
    vi.advanceTimersByTime(DEZ_MINUTOS);

    const resposta = await request(app).get('/me').set('Cookie', cookie);

    expect(resposta.status).toBe(200);
    const renovado = setCookieDaSessao(resposta);
    expect(renovado).toBeDefined();
    expect(expiracao(renovado!)).toBe(Date.now() + QUINZE_MINUTOS);
  });

  it('mantém a sessão de quem faz requisições com intervalo menor que 15 minutos', async () => {
    const cookie = await entrar();

    vi.advanceTimersByTime(DEZ_MINUTOS);
    expect((await request(app).get('/me').set('Cookie', cookie)).status).toBe(200);

    vi.advanceTimersByTime(DEZ_MINUTOS);
    expect((await request(app).get('/me').set('Cookie', cookie)).status).toBe(200);
  });

  it('expira a sessão depois de 15 minutos sem requisição', async () => {
    const cookie = await entrar();
    vi.advanceTimersByTime(QUINZE_MINUTOS + 1000);

    expect((await request(app).get('/me').set('Cookie', cookie)).status).toBe(401);
  });
});
