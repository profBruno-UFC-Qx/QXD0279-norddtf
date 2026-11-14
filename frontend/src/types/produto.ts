import type { Categoria } from './categoria'

export type TipoProduto = 'PERSONALIZAVEL' | 'VENDA_DIRETA'

export const TAMANHOS = ['P', 'M', 'G', 'GG', 'G1', 'G2'] as const

export type Tamanho = (typeof TAMANHOS)[number]

export type ItemProduto = {
  id: string
  nome: string
  preco: string
  ativo: boolean
  tipo: TipoProduto
  imagem: string | null
}

export type FaixaDePreco = { min: string; max: string }

export type ListagemProdutos = {
  itens: ItemProduto[]
  total: number
  pagina: number
  porPagina: number
  faixaDePreco: FaixaDePreco | null
}

export type FiltrosProdutos = {
  busca: string
  categorias: string[]
  tamanhos: Tamanho[]
  precoMin?: string
  precoMax?: string
  pagina: number
}

export type ImagemEnviada = { chave: string; url: string }

export type EntradaDeEstoque = { tamanho: Tamanho | null; quantidade: number }

export type CampoDeImagem =
  | 'imagemApresentacao'
  | 'imagemApresentacaoCostas'
  | 'imagemPersonalizacaoFrente'
  | 'imagemPersonalizacaoCostas'

export type CorDetalhada = Record<CampoDeImagem, ImagemEnviada | null> & {
  id: string
  nome: string
  hex: string
  vendida: boolean
  estoque: EntradaDeEstoque[]
}

export type ProdutoDetalhado = {
  id: string
  tipo: TipoProduto
  nome: string
  preco: string
  descricao: string | null
  temTamanho: boolean
  ativo: boolean
  vendido: boolean
  categorias: Categoria[]
  cores: CorDetalhada[]
  criadoEm: string
  atualizadoEm: string
}

export type DadosDaCor = Record<CampoDeImagem, string | null> & {
  nome: string
  hex: string
  estoque: EntradaDeEstoque[]
}

export type DadosDoProduto = {
  tipo: TipoProduto
  nome: string
  preco: string
  descricao: string | null
  categorias: string[]
  temTamanho: boolean
  cores: DadosDaCor[]
}

export type DadosDaEdicao = Omit<DadosDoProduto, 'tipo' | 'cores'> & {
  cores: (DadosDaCor & { id?: string })[]
}

export type Situacao = { id: string; ativo: boolean }
