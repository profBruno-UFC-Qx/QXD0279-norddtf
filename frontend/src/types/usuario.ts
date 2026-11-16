export type TipoPerfil = 'ADMIN' | 'USER'

export type EnderecoUsuario = {
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
} | null

export type UsuarioSessao = {
  id: string
  nome: string
  email: string
  tipoPerfil: TipoPerfil
  telefone: string | null
  endereco: EnderecoUsuario
  perfilCompleto: boolean
  pendencias: string[]
}

export type Perfil = 'visitante' | 'cliente' | 'admin'
