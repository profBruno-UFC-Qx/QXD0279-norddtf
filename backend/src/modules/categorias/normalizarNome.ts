export function normalizarNome(nome: string) {
  return nome.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
