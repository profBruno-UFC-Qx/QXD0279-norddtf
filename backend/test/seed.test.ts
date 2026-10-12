import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';
import { criarContasIniciais } from '../src/modules/users/seed/criarContasIniciais.js';
import { hashPassword, verifyPassword } from '../src/shared/utils/password.js';

const repository = new UsersRepository();

function variaveis() {
  const sufixo = randomUUID();
  return {
    SEED_ADMIN_EMAIL: `admin-${sufixo}@nordtf.test`,
    SEED_ADMIN_SENHA: 'admin1234',
    SEED_CLIENTE_EMAIL: `cliente-${sufixo}@nordtf.test`,
    SEED_CLIENTE_SENHA: 'cliente1234',
  };
}

function entrar(email: string, senha: string) {
  return request(app).post('/auth/login').send({ email, senha });
}

describe('seed das contas iniciais', () => {
  it('cria o admin e o cliente, e as duas contas entram pelo login', async () => {
    const env = variaveis();

    const resultados = await criarContasIniciais(env, repository);

    expect(resultados.map((resultado) => resultado.situacao)).toEqual(['criada', 'criada']);
    const admin = await entrar(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_SENHA);
    expect(admin.status).toBe(200);
    expect(admin.body.tipoPerfil).toBe('ADMIN');
    const cliente = await entrar(env.SEED_CLIENTE_EMAIL, env.SEED_CLIENTE_SENHA);
    expect(cliente.status).toBe(200);
    expect(cliente.body.tipoPerfil).toBe('USER');
  });

  it('rodar de novo não duplica nem altera as contas', async () => {
    const env = variaveis();
    await criarContasIniciais(env, repository);
    const antes = await repository.findByEmail(env.SEED_ADMIN_EMAIL);

    const resultados = await criarContasIniciais({ ...env, SEED_ADMIN_SENHA: 'outrasenha1' }, repository);

    expect(resultados.map((resultado) => resultado.situacao)).toEqual(['mantida', 'mantida']);
    const depois = await repository.findByEmail(env.SEED_ADMIN_EMAIL);
    expect(depois?.id).toBe(antes?.id);
    expect(depois?.senha).toBe(antes?.senha);
    expect(depois?.tipoPerfil).toBe('ADMIN');
  });

  it('mantém como cliente, e com a senha antiga, o e-mail do admin que já tinha conta', async () => {
    const env = variaveis();
    await repository.createWithPassword({ nome: 'Ana Souza', email: env.SEED_ADMIN_EMAIL, senhaHash: await hashPassword('antiga123') });

    const [resultadoDoAdmin] = await criarContasIniciais(env, repository);

    expect(resultadoDoAdmin?.situacao).toBe('mantida');
    const conta = await repository.findByEmail(env.SEED_ADMIN_EMAIL);
    expect(conta?.tipoPerfil).toBe('USER');
    expect(await verifyPassword(conta?.senha ?? '', 'antiga123')).toBe(true);
  });

  it('falha sem uma das variáveis e não cria nenhuma conta', async () => {
    const env = variaveis();

    await expect(criarContasIniciais({ ...env, SEED_CLIENTE_SENHA: undefined }, repository)).rejects.toThrow(
      'SEED_CLIENTE_SENHA não está definida.',
    );

    expect(await repository.findByEmail(env.SEED_ADMIN_EMAIL)).toBeNull();
    expect(await repository.findByEmail(env.SEED_CLIENTE_EMAIL)).toBeNull();
  });

  it('lista todos os erros de uma vez, inclusive os dois de uma mesma conta', async () => {
    const env = { ...variaveis(), SEED_ADMIN_EMAIL: 'nao-e-email', SEED_ADMIN_SENHA: '' };

    const falha = criarContasIniciais(env, repository);

    await expect(falha).rejects.toThrow('SEED_ADMIN_EMAIL: Informe um e-mail válido.');
    await expect(falha).rejects.toThrow('SEED_ADMIN_SENHA não está definida.');
    expect(await repository.findByEmail(env.SEED_CLIENTE_EMAIL)).toBeNull();
  });

  it('falha com senha fora da regra do cadastro e não cria nenhuma conta', async () => {
    const env = { ...variaveis(), SEED_ADMIN_SENHA: 'semnumero' };

    await expect(criarContasIniciais(env, repository)).rejects.toThrow(
      'SEED_ADMIN_SENHA: A senha precisa ter pelo menos um número.',
    );

    expect(await repository.findByEmail(env.SEED_ADMIN_EMAIL)).toBeNull();
    expect(await repository.findByEmail(env.SEED_CLIENTE_EMAIL)).toBeNull();
  });
});
