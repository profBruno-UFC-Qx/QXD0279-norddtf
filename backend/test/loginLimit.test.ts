import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';
import { hashPassword } from '../src/shared/utils/password.js';

const SENHA = 'senha1234';
const SENHA_ERRADA = 'errada1234';
const QUINZE_MINUTOS = 15 * 60 * 1000;
const MENSAGEM_BLOQUEIO = 'Muitas tentativas. Tente novamente em alguns minutos.';

const repository = new UsersRepository();

function emailUnico() {
  return `limite-${randomUUID()}@x.com`;
}

async function criarConta(email: string) {
  await repository.createWithPassword({ nome: 'Ana Souza', email, senhaHash: await hashPassword(SENHA) });
}

function tentar(email: string, senha: string) {
  return request(app).post('/auth/login').send({ email, senha });
}

async function falhar(email: string, vezes: number) {
  for (let i = 0; i < vezes; i++) {
    const resposta = await tentar(email, SENHA_ERRADA);
    expect(resposta.status).toBe(401);
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('limite de tentativas de login', () => {
  it('bloqueia a sexta tentativa, mesmo com a senha certa, e responde 429 com Retry-After', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 5);

    const resposta = await tentar(email, SENHA);

    expect(resposta.status).toBe(429);
    expect(resposta.body).toEqual({ code: 'MUITAS_TENTATIVAS', message: MENSAGEM_BLOQUEIO });
    expect(resposta.headers['retry-after']).toBe('900');
  });

  it('libera o login depois de passar os 15 minutos de bloqueio', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 5);

    vi.advanceTimersByTime(QUINZE_MINUTOS + 1000);

    expect((await tentar(email, SENHA)).status).toBe(200);
  });

  it('diminui o Retry-After e não estende o bloqueio com tentativas bloqueadas', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 5);

    vi.advanceTimersByTime(60 * 1000);
    const bloqueada = await tentar(email, SENHA);
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.headers['retry-after']).toBe('840');

    vi.advanceTimersByTime(QUINZE_MINUTOS - 60 * 1000 + 1000);
    expect((await tentar(email, SENHA)).status).toBe(200);
  });

  it('um login certo zera as falhas acumuladas', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 4);
    expect((await tentar(email, SENHA)).status).toBe(200);

    await falhar(email, 4);
  });

  it('a janela de 15 minutos zera as falhas antigas', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 4);

    vi.advanceTimersByTime(QUINZE_MINUTOS + 1000);

    await falhar(email, 4);
    expect((await tentar(email, SENHA)).status).toBe(200);
  });

  it('conta falhas de e-mail inexistente, para o bloqueio não revelar a existência da conta', async () => {
    const email = emailUnico();
    await falhar(email, 5);

    expect((await tentar(email, SENHA)).status).toBe(429);
  });

  it('trata e-mail com maiúsculas e espaços como o mesmo e-mail', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 3);

    for (let i = 0; i < 2; i++) {
      const resposta = await tentar(`  ${email.toUpperCase()} `, SENHA_ERRADA);
      expect(resposta.status).toBe(401);
    }

    expect((await tentar(email, SENHA)).status).toBe(429);
  });

  it('conta cinco falhas espaçadas que cabem em 15 minutos, mesmo sem ser seguidas', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 1);

    vi.advanceTimersByTime(14 * 60 * 1000 + 59 * 1000);
    await falhar(email, 3);

    vi.advanceTimersByTime(1000);
    await falhar(email, 1);

    expect((await tentar(email, SENHA)).status).toBe(429);
  });

  it('não bloqueia quando a quinta falha cai depois da janela de 15 minutos', async () => {
    const email = emailUnico();
    await criarConta(email);
    for (let i = 0; i < 4; i++) {
      await falhar(email, 1);
      vi.advanceTimersByTime(60 * 1000);
    }

    vi.advanceTimersByTime(13 * 60 * 1000);
    await falhar(email, 1);

    expect((await tentar(email, SENHA)).status).toBe(200);
  });

  it('bloqueia quando cinco falhas recentes se completam depois de um histórico longo', async () => {
    const email = emailUnico();
    await criarConta(email);
    await falhar(email, 1);
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(10 * 60 * 1000);
      await falhar(email, 1);
    }

    await falhar(email, 3);

    expect((await tentar(email, SENHA)).status).toBe(429);
  });

  it('não conta como falha uma tentativa que termina em erro interno', async () => {
    const email = emailUnico();
    await criarConta(email);
    const buscaComFalha = vi
      .spyOn(UsersRepository.prototype, 'findByEmail')
      .mockRejectedValue(new Error('banco indisponível'));

    for (let i = 0; i < 5; i++) {
      expect((await tentar(email, SENHA_ERRADA)).status).toBe(500);
    }
    buscaComFalha.mockRestore();

    expect((await tentar(email, SENHA)).status).toBe(200);
  });

  it('recusa tentativas simultâneas além da quinta, sem esperar a verificação terminar', async () => {
    const email = emailUnico();
    await criarConta(email);

    const respostas = await Promise.all(Array.from({ length: 10 }, () => tentar(email, SENHA_ERRADA)));
    const statuses = respostas.map((resposta) => resposta.status);

    expect(statuses.filter((status) => status === 401)).toHaveLength(5);
    expect(statuses.filter((status) => status === 429)).toHaveLength(5);
  });
});
