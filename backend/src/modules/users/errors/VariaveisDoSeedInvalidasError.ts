export class VariaveisDoSeedInvalidasError extends Error {
  constructor(erros: string[]) {
    super(`O seed não criou nenhuma conta:\n- ${erros.join('\n- ')}`);
    this.name = 'VariaveisDoSeedInvalidasError';
  }
}
