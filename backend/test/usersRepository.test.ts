import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { EmailJaCadastradoError } from '../src/modules/users/errors/EmailJaCadastradoError.js';
import { UsersRepository } from '../src/modules/users/repositories/UsersRepository.js';

const repository = new UsersRepository();

function emailUnico() {
  return `usuario-${randomUUID()}@x.com`;
}

describe('UsersRepository.findByEmail', () => {
  it('retorna null para e-mail inexistente', async () => {
    expect(await repository.findByEmail(emailUnico())).toBeNull();
  });

  it('encontra o usuário pelo e-mail', async () => {
    const email = emailUnico();
    const criado = await repository.createWithPassword({ nome: 'Ana', email, senhaHash: 'hash-de-teste' });

    const encontrado = await repository.findByEmail(email);

    expect(encontrado?.id).toBe(criado.id);
  });
});

describe('UsersRepository.createWithPassword', () => {
  it('cria o usuário com a senha recebida, sub nulo e tipo de perfil USER', async () => {
    const email = emailUnico();

    const criado = await repository.createWithPassword({ nome: 'Ana', email, senhaHash: 'hash-de-teste' });

    expect(criado.nome).toBe('Ana');
    expect(criado.email).toBe(email);
    expect(criado.senha).toBe('hash-de-teste');
    expect(criado.sub).toBeNull();
    expect(criado.tipoPerfil).toBe('USER');
  });

  it('lança EmailJaCadastradoError ao criar um segundo usuário com o mesmo e-mail', async () => {
    const email = emailUnico();
    await repository.createWithPassword({ nome: 'Ana', email, senhaHash: 'hash-de-teste' });

    await expect(
      repository.createWithPassword({ nome: 'Beto', email, senhaHash: 'hash-de-teste' }),
    ).rejects.toBeInstanceOf(EmailJaCadastradoError);
  });

  it('em criações simultâneas com o mesmo e-mail, cria uma conta e lança um erro de domínio', async () => {
    const email = emailUnico();

    const resultados = await Promise.allSettled([
      repository.createWithPassword({ nome: 'Ana', email, senhaHash: 'hash-de-teste' }),
      repository.createWithPassword({ nome: 'Beto', email, senhaHash: 'hash-de-teste' }),
    ]);

    const sucessos = resultados.filter((resultado) => resultado.status === 'fulfilled');
    const falhas = resultados.filter((resultado) => resultado.status === 'rejected');

    expect(sucessos).toHaveLength(1);
    expect(falhas).toHaveLength(1);
    const [falha] = falhas as PromiseRejectedResult[];
    expect(falha?.reason).toBeInstanceOf(EmailJaCadastradoError);
    expect(await repository.findByEmail(email)).not.toBeNull();
  });

  it('propaga erros que não são de e-mail duplicado sem convertê-los', async () => {
    const erro = await repository
      .createWithPassword({ nome: null as unknown as string, email: emailUnico(), senhaHash: 'hash-de-teste' })
      .catch((motivo: unknown) => motivo);

    expect(erro).toBeInstanceOf(Error);
    expect(erro).not.toBeInstanceOf(EmailJaCadastradoError);
  });
});
