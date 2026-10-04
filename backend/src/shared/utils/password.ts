import argon2 from 'argon2';

export function hashPassword(senha: string) {
  return argon2.hash(senha, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, senha: string) {
  return argon2.verify(hash, senha);
}

let hashFicticio: Promise<string> | undefined;

export async function verifyPasswordWithoutAccount(senha: string): Promise<false> {
  hashFicticio ??= hashPassword('hash-ficticio').catch((erro: unknown) => {
    hashFicticio = undefined;
    throw erro;
  });
  await verifyPassword(await hashFicticio, senha);
  return false;
}
