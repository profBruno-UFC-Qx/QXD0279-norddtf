export function toSafeUser<T extends { senha: string | null }>(user: T): Omit<T, 'senha'> {
  const { senha: _senha, ...safeUser } = user;
  return safeUser;
}
