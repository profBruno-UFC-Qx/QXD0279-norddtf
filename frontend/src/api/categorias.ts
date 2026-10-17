import { api } from '@/api/http'
import type { Categoria, CategoriaComUso } from '@/types/categoria'

export function listarCategoriasComUso(sinal?: AbortSignal) {
  return api.get<CategoriaComUso[]>('/admin/categorias', sinal)
}

export function criarCategoria(nome: string) {
  return api.post<Categoria>('/admin/categorias', { nome })
}

export function renomearCategoria(id: string, nome: string) {
  return api.put<Categoria>(`/admin/categorias/${id}`, { nome })
}

export function removerCategoria(id: string) {
  return api.delete<void>(`/admin/categorias/${id}`)
}
