import argon2 from 'argon2';

export function hashPassword(senha: string) {
  return argon2.hash(senha, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, senha: string) {
  return argon2.verify(hash, senha);
}
