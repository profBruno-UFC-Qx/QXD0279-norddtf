import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';
import { hashPassword, verifyPasswordWithoutAccount } from '../src/shared/utils/password.js';

vi.mock('../src/shared/utils/password.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/shared/utils/password.js')>();
  return { ...actual, verifyPasswordWithoutAccount: vi.fn(actual.verifyPasswordWithoutAccount) };
});

const SENHA = 'senha1234';
const CREDENCIAIS_INVALIDAS = { code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos.' };

const repository = new UsersRepository();

function emailUnico() {
  return `login-${randomUUID()}@x.com`;
}

async function criarContaComSenha(email: string) {
  return repository.createWithPassword({
    nome: 'Ana Souza',
    email,
    senhaHash: await hashPassword(SENHA),
  });
}

function cookieDe(resposta: request.Response) {
  return resposta.headers['set-cookie']?.[0]?.split(';')[0];
}

beforeEach(() => {
  vi.mocked(verifyPasswordWithoutAccount).mockClear();
});

describe('POST /auth/login', () => {
  it('com credenciais corretas, responde 200 sem senha, abre a sessão e GET /me retorna o usuário', async () => {
    const email = emailUnico();
    const conta = await criarContaComSenha(email);
    const agent = request.agent(app);

    const resposta = await agent.post('/auth/login').send({ email, senha: SENHA });

    expect(resposta.status).toBe(200);
    expect(resposta.body).not.toHaveProperty('senha');
    expect(resposta.body.id).toBe(conta.id);
    expect(resposta.headers['set-cookie']).toBeDefined();

    const me = await agent.get('/me');
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(conta.id);
  });

  it('normaliza o e-mail com maiúsculas e espaços', async () => {
    const email = emailUnico();
    await criarContaComSenha(email);

    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: `  ${email.toUpperCase()} `, senha: SENHA });

    expect(resposta.status).toBe(200);
  });

  it('troca o cookie de sessão no login', async () => {
    const email = emailUnico();
    await criarContaComSenha(email);
    const anterior = await request(app).get('/health');
    const cookieAnterior = cookieDe(anterior);

    const resposta = await request(app)
      .post('/auth/login')
      .set('Cookie', cookieAnterior ?? '')
      .send({ email, senha: SENHA });

    expect(resposta.status).toBe(200);
    expect(cookieAnterior).toBeDefined();
    expect(cookieDe(resposta)).not.toBe(cookieAnterior);
  });

  it('responde 401 com o mesmo corpo para senha errada, e-mail inexistente e conta do Google', async () => {
    const emailSenhaErrada = emailUnico();
    await criarContaComSenha(emailSenhaErrada);

    const emailGoogle = emailUnico();
    await repository.findOrCreateByGoogleProfile({
      sub: `google-${randomUUID()}`,
      email: emailGoogle,
      emailVerified: true,
      nome: 'Conta Google',
    });

    const senhaErrada = await request(app).post('/auth/login').send({ email: emailSenhaErrada, senha: 'outra1234' });
    const inexistente = await request(app).post('/auth/login').send({ email: emailUnico(), senha: SENHA });
    const google = await request(app).post('/auth/login').send({ email: emailGoogle, senha: SENHA });

    for (const resposta of [senhaErrada, inexistente, google]) {
      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual(CREDENCIAIS_INVALIDAS);
    }
  });

  it('chama verifyPasswordWithoutAccount quando a conta não existe', async () => {
    await request(app).post('/auth/login').send({ email: emailUnico(), senha: SENHA });

    expect(verifyPasswordWithoutAccount).toHaveBeenCalledTimes(1);
  });

  it('chama verifyPasswordWithoutAccount para conta do Google, que não tem senha', async () => {
    const email = emailUnico();
    await repository.findOrCreateByGoogleProfile({
      sub: `google-${randomUUID()}`,
      email,
      emailVerified: true,
      nome: 'Conta Google',
    });

    await request(app).post('/auth/login').send({ email, senha: SENHA });

    expect(verifyPasswordWithoutAccount).toHaveBeenCalledTimes(1);
  });

  it('responde só depois de concluir a verificação sem conta', async () => {
    let concluiu = false;
    vi.mocked(verifyPasswordWithoutAccount).mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      concluiu = true;
      return false;
    });

    const resposta = await request(app).post('/auth/login').send({ email: emailUnico(), senha: SENHA });

    expect(resposta.status).toBe(401);
    expect(concluiu).toBe(true);
  });

  it('não chama verifyPasswordWithoutAccount quando a conta existe e tem senha', async () => {
    const email = emailUnico();
    await criarContaComSenha(email);

    await request(app).post('/auth/login').send({ email, senha: 'outra1234' });

    expect(verifyPasswordWithoutAccount).not.toHaveBeenCalled();
  });

  it('responde 400 com errors por campo quando algum campo falta', async () => {
    const resposta = await request(app).post('/auth/login').send({ email: emailUnico() });

    expect(resposta.status).toBe(400);
    expect(resposta.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(resposta.body.errors)).toEqual(['senha']);
    expect(resposta.body.errors.senha).toBe('Informe a senha.');
  });

  it('não valida formato de e-mail, então e-mail malformado recebe o 401 genérico', async () => {
    const resposta = await request(app).post('/auth/login').send({ email: 'nao-e-email', senha: SENHA });

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual(CREDENCIAIS_INVALIDAS);
  });
});
