import { api } from '@/api/http'
import type { UsuarioSessao } from '@/types/usuario'

export function atualizarPerfil(nome: string, telefone: string | null) {
  return api.patch<UsuarioSessao>('/me', { nome, telefone })
}

export function atualizarEndereco(dados: {
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
}) {
  return api.put<UsuarioSessao>('/me/endereco', dados)
}
