export type TipoPerfil = 'ADMIN' | 'USER'

export type UsuarioSessao = { id: string; nome: string; email: string; tipoPerfil: TipoPerfil }

export type Perfil = 'visitante' | 'cliente' | 'admin'
