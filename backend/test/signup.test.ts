import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';

const MENSAGEM_CONTA_EXISTENTE =
  'Já existe uma conta com este e-mail. Tente entrar com e-mail e senha ou com o Google.';

const repository = new UsersRepository();

function emailUnico() {
  return `cadastro-${randomUUID()}@x.com`;
}

function dadosValidos(email = emailUnico()) {
  return { nome: 'Ana Souza', email, senha: 'senha1234' };
}

function cookieDe(resposta: request.Response) {
  return resposta.headers['set-cookie']?.[0]?.split(';')[0];
}

describe('POST /auth/signup', () => {
  it('cria a conta, responde 201 sem senha e deixa a sessão logada', async () => {
    const agent = request.agent(app);
    const email = emailUnico();

    const resposta = await agent.post('/auth/signup').send(dadosValidos(email));

    expect(resposta.status).toBe(201);
    expect(resposta.body).not.toHaveProperty('senha');
    expect(resposta.body.email).toBe(email);
    expect(resposta.headers['set-cookie']).toBeDefined();

    const me = await agent.get('/me');
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(resposta.body.id);
    expect(me.body).not.toHaveProperty('senha');

    const registro = await repository.findByEmail(email);
    expect(registro?.senha).toMatch(/^\$argon2id\$/);
  });

  it('ignora o tipo de perfil enviado e cria o usuário como USER', async () => {
    const resposta = await request(app)
      .post('/auth/signup')
      .send({ ...dadosValidos(), tipoPerfil: 'ADMIN' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.tipoPerfil).toBe('USER');
  });

  it('responde 400 com errors por campo e não cria conta quando os dados são inválidos', async () => {
    const email = emailUnico();

    const resposta = await request(app)
      .post('/auth/signup')
      .send({ nome: '   ', email, senha: 'curta' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(resposta.body.errors).sort()).toEqual(['nome', 'senha']);
    expect(resposta.body.errors.nome).toBe('Informe o nome.');
    expect(resposta.body.errors.senha).toBe('A senha precisa ter pelo menos 8 caracteres.');
    expect(await repository.findByEmail(email)).toBeNull();
  });

  it('responde 400 quando o corpo não é enviado', async () => {
    const resposta = await request(app).post('/auth/signup');

    expect(resposta.status).toBe(400);
    expect(resposta.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(resposta.body.errors).sort()).toEqual(['email', 'nome', 'senha']);
  });

  it.each([
    ['sem letra', '12345678', 'A senha precisa ter pelo menos uma letra.'],
    ['sem número', 'senhadeletras', 'A senha precisa ter pelo menos um número.'],
    ['acima de 128 caracteres', `a1${'b'.repeat(127)}`, 'A senha pode ter no máximo 128 caracteres.'],
  ])('responde 400 com a mensagem certa para senha %s', async (_, senha, mensagem) => {
    const resposta = await request(app).post('/auth/signup').send({ ...dadosValidos(), senha });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors.senha).toBe(mensagem);
  });

  it('responde 400 com a mensagem certa para e-mail sem formato', async () => {
    const resposta = await request(app).post('/auth/signup').send({ ...dadosValidos(), email: 'nao-e-email' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors.email).toBe('Informe um e-mail válido.');
  });

  it('responde 409 com a mensagem de conta existente para e-mail já cadastrado por senha', async () => {
    const email = emailUnico();
    await request(app).post('/auth/signup').send(dadosValidos(email));

    const resposta = await request(app).post('/auth/signup').send(dadosValidos(email));

    expect(resposta.status).toBe(409);
    expect(resposta.body.code).toBe('EMAIL_JA_CADASTRADO');
    expect(resposta.body.message).toBe(MENSAGEM_CONTA_EXISTENTE);
  });

  it('responde 409 quando o e-mail difere só em maiúsculas e espaços', async () => {
    const email = emailUnico();
    await request(app).post('/auth/signup').send(dadosValidos(email));

    const resposta = await request(app)
      .post('/auth/signup')
      .send(dadosValidos(`  ${email.toUpperCase()} `));

    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toBe(MENSAGEM_CONTA_EXISTENTE);
  });

  it('responde 409 para e-mail já cadastrado pelo Google', async () => {
    const email = emailUnico();
    await repository.findOrCreateByGoogleProfile({
      sub: `google-${randomUUID()}`,
      email,
      emailVerified: true,
      nome: 'Conta Google',
    });

    const resposta = await request(app).post('/auth/signup').send(dadosValidos(email));

    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toBe(MENSAGEM_CONTA_EXISTENTE);
  });

  it('troca o cookie de sessão entre a requisição anterior e o cadastro', async () => {
    const anterior = await request(app).get('/health');
    const cookieAnterior = cookieDe(anterior);

    const resposta = await request(app)
      .post('/auth/signup')
      .set('Cookie', cookieAnterior ?? '')
      .send(dadosValidos());

    expect(resposta.status).toBe(201);
    expect(cookieAnterior).toBeDefined();
    expect(cookieDe(resposta)).not.toBe(cookieAnterior);
  });
});
