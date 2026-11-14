export type TipoProduto = 'PERSONALIZAVEL' | 'VENDA_DIRETA'

export type ItemProduto = {
  id: string
  nome: string
  preco: string
  ativo: boolean
  tipo: TipoProduto
  imagem: string | null
}
