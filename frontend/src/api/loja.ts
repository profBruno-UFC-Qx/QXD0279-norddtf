import { api } from '@/api/http'
import { parametrosDaListagem } from '@/api/produtos'
import type { FiltrosProdutos, ListagemDaLoja, ProdutoDaLoja } from '@/types/produto'

export function listarProdutosDaLoja(filtros: FiltrosProdutos, sinal?: AbortSignal) {
  return api.get<ListagemDaLoja>(`/produtos?${parametrosDaListagem(filtros)}`, sinal)
}

export function detalharProdutoDaLoja(id: string, sinal?: AbortSignal) {
  return api.get<ProdutoDaLoja>(`/produtos/${encodeURIComponent(id)}`, sinal)
}
