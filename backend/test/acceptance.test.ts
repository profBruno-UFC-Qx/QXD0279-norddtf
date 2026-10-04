import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';
import { GoogleAuthService } from '../src/modules/users/useCases/googleAuth/GoogleAuthService.js';
import { hashPassword } from '../src/shared/utils/password.js';

const SENHA = 'senha1234';
const FRONTEND = 'http://localhost:5173';
const MENSAGEM_CONTA_EXISTENTE =
  'Já existe uma conta com este e-mail. Tente entrar com e-mail e senha ou com o Google.';
const CREDENCIAIS_INVALIDAS = { code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos.' };
const QUINZE_MINUTOS = 15 * 60 * 1000;

const repository = new UsersRepository();

function emailUnico() {
  return `aceite-${randomUUID()}@x.com`;
}

function dadosValidos(email = emailUnico()) {
  return { nome: 'Ana Souza', email, senha: SENHA };
}

async function criarContaComSenha(email: string) {
  return repository.createWithPassword({
    nome: 'Ana Souza',
    email,
    senhaHash: await hashPassword(SENHA),
  });
}

async function criarContaGoogle(email: string) {
  return repository.findOrCreateByGoogleProfile({
    sub: `google-${randomUUID()}`,
    email,
    emailVerified: true,
    nome: 'Conta Google',
  });
}

function cookieDe(resposta: request.Response) {
  return resposta.headers['set-cookie']?.[0]?.split(';')[0];
}

function entrar(email: string, senha: string) {
  return request(app).post('/auth/login').send({ email, senha });
}

beforeAll(() => {
  vi.stubEnv('FRONTEND_URL', FRONTEND);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('critério 1: cadastro válido', () => {
  it('cria a conta, responde 201 sem senha, deixa a sessão logada e GET /me retorna o mesmo usuário', async () => {
    const agent = request.agent(app);
    const dados = dadosValidos();

    const cadastro = await agent.post('/auth/signup').send(dados);
    const me = await agent.get('/me');

    expect(cadastro.status).toBe(201);
    expect(cadastro.body).not.toHaveProperty('senha');
    expect(me.status).toBe(200);
    expect(me.body).toEqual(cadastro.body);
  });

  it('guarda a senha como hash argon2id, sem texto puro no banco nem nas respostas', async () => {
    const dados = dadosValidos();

    const cadastro = await request(app).post('/auth/signup').send(dados);
    const registro = await repository.findByEmail(dados.email);

    expect(registro?.senha).toMatch(/^\$argon2id\$/);
    expect(registro?.senha).not.toContain(SENHA);
    expect(JSON.stringify(cadastro.body)).not.toContain(SENHA);
  });
});

describe('critério 2: cadastro inválido', () => {
  it.each([
    ['nome vazio', { nome: '' }, 'nome'],
    ['e-mail malformado', { email: 'nao-e-email' }, 'email'],
    ['senha com menos de 8 caracteres', { senha: 'a1' }, 'senha'],
    ['senha sem letra', { senha: '12345678' }, 'senha'],
    ['senha sem número', { senha: 'senhadeletras' }, 'senha'],
    ['senha com mais de 128 caracteres', { senha: `a1${'b'.repeat(127)}` }, 'senha'],
  ])('responde 400 com VALIDATION_ERROR e não cria conta quando %s', async (_, sobrescrita, campo) => {
    const dados = { ...dadosValidos(), ...sobrescrita };

    const resposta = await request(app).post('/auth/signup').send(dados);

    expect(resposta.status).toBe(400);
    expect(resposta.body.code).toBe('VALIDATION_ERROR');
    expect(resposta.body.errors).toHaveProperty(campo);
    expect(await repository.findByEmail(dados.email)).toBeNull();
  });

  it('ignora o tipo de perfil enviado e cria o usuário como USER', async () => {
    const resposta = await request(app)
      .post('/auth/signup')
      .send({ ...dadosValidos(), tipoPerfil: 'ADMIN' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.tipoPerfil).toBe('USER');
  });
});

describe('critério 3: e-mail já cadastrado', () => {
  it('responde 409 com a mensagem de conta existente para conta criada por senha', async () => {
    const dados = dadosValidos();
    await request(app).post('/auth/signup').send(dados);

    const resposta = await request(app).post('/auth/signup').send(dados);

    expect(resposta.status).toBe(409);
    expect(resposta.body.code).toBe('EMAIL_JA_CADASTRADO');
    expect(resposta.body.message).toBe(MENSAGEM_CONTA_EXISTENTE);
  });

  it('responde 409 para conta criada pelo Google', async () => {
    const email = emailUnico();
    await criarContaGoogle(email);

    const resposta = await request(app).post('/auth/signup').send(dadosValidos(email));

    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toBe(MENSAGEM_CONTA_EXISTENTE);
  });

  it('compara o e-mail ignorando maiúsculas e espaços nas pontas', async () => {
    const email = emailUnico();
    await request(app).post('/auth/signup').send(dadosValidos(email));

    const resposta = await request(app)
      .post('/auth/signup')
      .send(dadosValidos(`  ${email.toUpperCase()} `));

    expect(resposta.status).toBe(409);
  });

  it('com dois cadastros simultâneos do mesmo e-mail, cria uma conta e responde 409 ao outro', async () => {
    const email = emailUnico();

    const respostas = await Promise.all([
      request(app).post('/auth/signup').send(dadosValidos(email)),
      request(app).post('/auth/signup').send(dadosValidos(email)),
    ]);

    expect(respostas.map((resposta) => resposta.status).sort()).toEqual([201, 409]);
    expect(await repository.findByEmail(email)).not.toBeNull();
  });
});

describe('critério 4: login com e-mail e senha', () => {
  it('com credenciais corretas, responde 200 sem senha, cria a sessão e GET /me retorna o usuário', async () => {
    const email = emailUnico();
    const conta = await criarContaComSenha(email);
    const agent = request.agent(app);

    const resposta = await agent.post('/auth/login').send({ email, senha: SENHA });
    const me = await agent.get('/me');

    expect(resposta.status).toBe(200);
    expect(resposta.body).not.toHaveProperty('senha');
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(conta.id);
  });

  it('responde 401 com a mesma mensagem para senha errada, e-mail inexistente e conta do Google', async () => {
    const emailSenhaErrada = emailUnico();
    await criarContaComSenha(emailSenhaErrada);
    const emailGoogle = emailUnico();
    await criarContaGoogle(emailGoogle);

    const respostas = [
      await entrar(emailSenhaErrada, 'outra1234'),
      await entrar(emailUnico(), SENHA),
      await entrar(emailGoogle, SENHA),
    ];

    for (const resposta of respostas) {
      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual(CREDENCIAIS_INVALIDAS);
    }
  });
});

describe('critério 5: limite de tentativas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('após 5 falhas, a próxima tentativa responde 429 com Retry-After, mesmo com a senha certa', async () => {
    const email = emailUnico();
    await criarContaComSenha(email);
    for (let i = 0; i < 5; i++) {
      expect((await entrar(email, 'errada1234')).status).toBe(401);
    }

    const resposta = await entrar(email, SENHA);

    expect(resposta.status).toBe(429);
    expect(resposta.body.code).toBe('MUITAS_TENTATIVAS');
    expect(resposta.headers['retry-after']).toBe('900');
  });

  it('passados 15 minutos, o login volta a funcionar', async () => {
    const email = emailUnico();
    await criarContaComSenha(email);
    for (let i = 0; i < 5; i++) {
      expect((await entrar(email, 'errada1234')).status).toBe(401);
    }
    expect((await entrar(email, SENHA)).status).toBe(429);

    vi.advanceTimersByTime(QUINZE_MINUTOS + 1000);

    expect((await entrar(email, SENHA)).status).toBe(200);
  });
});

describe('critério 6: sessão e logout', () => {
  it('o identificador da sessão muda após o cadastro e após o login', async () => {
    const email = emailUnico();
    await criarContaComSenha(email);
    const anteriorCadastro = cookieDe(await request(app).get('/health'));
    const anteriorLogin = cookieDe(await request(app).get('/health'));

    const cadastro = await request(app)
      .post('/auth/signup')
      .set('Cookie', anteriorCadastro ?? '')
      .send(dadosValidos());
    const login = await request(app)
      .post('/auth/login')
      .set('Cookie', anteriorLogin ?? '')
      .send({ email, senha: SENHA });

    expect(anteriorCadastro).toBeDefined();
    expect(anteriorLogin).toBeDefined();
    expect(cadastro.status).toBe(201);
    expect(login.status).toBe(200);
    expect(cookieDe(cadastro)).toBeDefined();
    expect(cookieDe(login)).toBeDefined();
    expect(cookieDe(cadastro)).not.toBe(anteriorCadastro);
    expect(cookieDe(login)).not.toBe(anteriorLogin);
  });

  it('logout encerra a sessão aberta por cadastro e por login, e GET /me responde 401', async () => {
    const agentCadastro = request.agent(app);
    await agentCadastro.post('/auth/signup').send(dadosValidos());
    const emailLogin = emailUnico();
    await criarContaComSenha(emailLogin);
    const agentLogin = request.agent(app);
    await agentLogin.post('/auth/login').send({ email: emailLogin, senha: SENHA });

    for (const agent of [agentCadastro, agentLogin]) {
      expect((await agent.get('/me')).status).toBe(200);
      expect((await agent.post('/auth/logout')).status).toBe(204);
      expect((await agent.get('/me')).status).toBe(401);
    }
  });
});

describe('regressão do que já existia', () => {
  it('GET /me sem sessão responde 401', async () => {
    expect((await request(app).get('/me')).status).toBe(401);
  });

  it('GET /auth/google redireciona para a página de autorização do Google', async () => {
    const resposta = await request(app).get('/auth/google');

    expect(resposta.status).toBe(302);
    expect(new URL(resposta.headers['location'] ?? '').origin).toBe('https://accounts.google.com');
  });

  it('GET /auth/google/callback com error redireciona para o login com o erro', async () => {
    const resposta = await request(app).get('/auth/google/callback?error=access_denied');

    expect(resposta.status).toBe(302);
    expect(resposta.headers['location']).toBe(`${FRONTEND}/login?error=access_denied`);
  });

  it('GET /auth/google/callback com state inválido redireciona com invalid_state', async () => {
    const resposta = await request(app).get('/auth/google/callback?code=abc&state=invalido');

    expect(resposta.status).toBe(302);
    expect(resposta.headers['location']).toBe(`${FRONTEND}/login?error=invalid_state`);
  });

  describe('login pelo Google com a troca de tokens mockada', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('cria a sessão, redireciona para o frontend e GET /me retorna o usuário Google', async () => {
      const email = emailUnico();
      const getToken = vi.spyOn(GoogleAuthService.prototype, 'getToken').mockResolvedValue({ id_token: 'token-falso' });
      vi.spyOn(GoogleAuthService.prototype, 'verifyIdToken').mockResolvedValue({
        sub: `google-${randomUUID()}`,
        email,
        email_verified: true,
        name: 'Conta Google',
      } as Awaited<ReturnType<GoogleAuthService['verifyIdToken']>>);
      const agent = request.agent(app);

      const inicio = await agent.get('/auth/google');
      const state = new URL(inicio.headers['location'] ?? '').searchParams.get('state');
      const callback = await agent.get(`/auth/google/callback?code=abc&state=${state}`);
      const me = await agent.get('/me');

      expect(getToken).toHaveBeenCalledWith('abc', expect.any(String));
      expect(callback.status).toBe(302);
      expect(callback.headers['location']).toBe(FRONTEND);
      expect(me.status).toBe(200);
      expect(me.body.email).toBe(email);
    });
  });
});
