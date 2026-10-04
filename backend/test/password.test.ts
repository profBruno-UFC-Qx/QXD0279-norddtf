import argon2 from 'argon2';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from '../src/shared/utils/password.js';

describe('hashPassword', () => {
  it('gera hash argon2id que não contém a senha em texto puro', async () => {
    const hash = await hashPassword('senha1234');

    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('senha1234');
  });

  it('gera hashes diferentes para a mesma senha, por causa do salt', async () => {
    const primeiro = await hashPassword('senha1234');
    const segundo = await hashPassword('senha1234');

    expect(primeiro).not.toBe(segundo);
  });
});

describe('verifyPassword', () => {
  it('aceita a senha certa', async () => {
    const hash = await hashPassword('senha1234');

    expect(await verifyPassword(hash, 'senha1234')).toBe(true);
  });

  it('recusa a senha errada', async () => {
    const hash = await hashPassword('senha1234');

    expect(await verifyPassword(hash, 'senha1235')).toBe(false);
  });
});

describe('verifyPasswordWithoutAccount', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('executa uma verificação argon2 real e retorna false', async () => {
    const { verifyPasswordWithoutAccount } = await import('../src/shared/utils/password.js');
    const verificacao = vi.spyOn(argon2, 'verify');

    expect(await verifyPasswordWithoutAccount('qualquer')).toBe(false);
    expect(verificacao).toHaveBeenCalledTimes(1);
  });

  it('tenta gerar o hash fictício de novo depois de uma falha', async () => {
    vi.resetModules();
    const { verifyPasswordWithoutAccount } = await import('../src/shared/utils/password.js');
    vi.spyOn(argon2, 'hash').mockRejectedValueOnce(new Error('falha de memória'));

    await expect(verifyPasswordWithoutAccount('qualquer')).rejects.toThrow('falha de memória');
    await expect(verifyPasswordWithoutAccount('qualquer')).resolves.toBe(false);
  });
});
