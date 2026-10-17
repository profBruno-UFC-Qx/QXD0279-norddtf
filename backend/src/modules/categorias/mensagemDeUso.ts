function contar(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function mensagemDeUso(produtos: number, estampas: number) {
  return `Esta categoria está em uso por ${contar(produtos, 'produto', 'produtos')} e ${contar(estampas, 'estampa', 'estampas')}. Retire-a deles antes de remover.`;
}
