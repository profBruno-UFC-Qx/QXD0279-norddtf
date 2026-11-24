import { api } from '@/api/http'

export type ItemSacola = {
  id: string
  tipo: 'PRODUTO' | 'MATERIAL'
  produtoVarianteId: string | null
  produtoNome: string | null
  produtoTipo: string | null
  corNome: string | null
  corHex: string | null
  tamanho: string | null
  quantidade: number | null
  materialNome: string | null
  comprimentoCm: number | null
  precoUnitario: number
  selecionado: boolean
  estampas: {
    id: string
    arteClienteUrl: string | null
    posicao: string | null
    quantidade: number
    larguraCm: number
    alturaCm: number
  }[]
  valorTotal: number | null
}

export type SacolaSaida = {
  itens: ItemSacola[]
  total: number
}

export type AdicionarItemSacolaEntrada = {
  tipo: 'PRODUTO' | 'MATERIAL'
  produtoVarianteId?: string
  quantidade?: number
  materialId?: string
  comprimentoCm?: number
  precoUnitario: number
  estampas?: Array<{
    arteClienteUrl?: string
    posicao?: string
    quantidade: number
    larguraCm: number
    alturaCm: number
  }>
}

export type AtualizarItemSacolaEntrada = {
  quantidade?: number
  selecionado?: boolean
}

export function listarSacola() {
  return api.get<SacolaSaida>('/sacola')
}

export function adicionarItemSacola(dados: AdicionarItemSacolaEntrada) {
  return api.post('/sacola/itens', dados)
}

export function atualizarItemSacola(id: string, dados: AtualizarItemSacolaEntrada) {
  return api.patch(`/sacola/itens/${encodeURIComponent(id)}`, dados)
}

export function removerItemSacola(id: string) {
  return api.delete(`/sacola/itens/${encodeURIComponent(id)}`)
}
