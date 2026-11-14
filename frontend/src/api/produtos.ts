import { api } from '@/api/http'
import type {
  DadosDaEdicao,
  DadosDoProduto,
  FiltrosProdutos,
  ImagemEnviada,
  ListagemProdutos,
  ProdutoDetalhado,
  Situacao,
} from '@/types/produto'

function parametrosDaListagem(filtros: FiltrosProdutos) {
  const parametros = new URLSearchParams()
  if (filtros.busca) parametros.set('busca', filtros.busca)
  if (filtros.categorias.length) parametros.set('categorias', filtros.categorias.join(','))
  if (filtros.tamanhos.length) parametros.set('tamanhos', filtros.tamanhos.join(','))
  if (filtros.precoMin) parametros.set('precoMin', filtros.precoMin)
  if (filtros.precoMax) parametros.set('precoMax', filtros.precoMax)
  parametros.set('pagina', String(filtros.pagina))
  return parametros
}

export function listarProdutos(filtros: FiltrosProdutos, sinal?: AbortSignal) {
  return api.get<ListagemProdutos>(`/admin/produtos?${parametrosDaListagem(filtros)}`, sinal)
}

export function detalharProduto(id: string, sinal?: AbortSignal) {
  return api.get<ProdutoDetalhado>(`/admin/produtos/${encodeURIComponent(id)}`, sinal)
}

export function cadastrarProduto(dados: DadosDoProduto) {
  return api.post<ProdutoDetalhado>('/admin/produtos', dados)
}

export function editarProduto(id: string, dados: DadosDaEdicao) {
  return api.put<ProdutoDetalhado>(`/admin/produtos/${encodeURIComponent(id)}`, dados)
}

export function mudarSituacao(id: string, ativo: boolean) {
  return api.patch<Situacao>(`/admin/produtos/${encodeURIComponent(id)}/situacao`, { ativo })
}

export function removerProduto(id: string) {
  return api.delete<void>(`/admin/produtos/${encodeURIComponent(id)}`)
}

export function enviarImagem(arquivo: File, sinal?: AbortSignal) {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  return api.enviarArquivo<ImagemEnviada>('/admin/imagens', formulario, sinal)
}
