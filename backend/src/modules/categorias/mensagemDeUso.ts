function contar(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function mensagemDeUso(produtos: number) {
  return `Esta categoria está em uso por ${contar(produtos, 'produto', 'produtos')}. Retire-a deles antes de remover.`;
}
