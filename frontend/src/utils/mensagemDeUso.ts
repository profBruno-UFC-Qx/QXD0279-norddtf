export function mensagemDeUso(produtos: number) {
  if (produtos === 1)
    return 'Esta categoria está em uso por 1 produto. Retire-a dele antes de remover.'
  return `Esta categoria está em uso por ${produtos} produtos. Retire-a deles antes de remover.`
}
