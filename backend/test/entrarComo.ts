import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { expect } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { hashPassword } from '../src/shared/utils/password.js';

const SENHA = 'senha1234';

const repository = new UsersRepository();

export async function entrarComo(tipoPerfil: 'ADMIN' | 'USER') {
  const email = `admin-${randomUUID()}@x.com`;
  const conta = await repository.createWithPassword({ nome: 'Ana Souza', email, senhaHash: await hashPassword(SENHA) });
  if (tipoPerfil === 'ADMIN') {
    await db.orm.public.User.where({ id: conta.id }).update({ tipoPerfil: 'ADMIN' });
  }

  const agent = request.agent(app);
  const login = await agent.post('/auth/login').send({ email, senha: SENHA });
  expect(login.status).toBe(200);
  expect(login.body.tipoPerfil).toBe(tipoPerfil);
  return { agent, id: conta.id };
}
