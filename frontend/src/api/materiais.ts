import { api } from '@/api/http'
import type { DadosDoMaterial, Material, TipoMaterial } from '@/types/material'

export function listarMateriais(sinal?: AbortSignal) {
  return api.get<Material[]>('/materiais', sinal)
}

export function atualizarMaterial(tipo: TipoMaterial, dados: DadosDoMaterial) {
  return api.put<Material>(`/admin/materiais/${tipo}`, dados)
}
