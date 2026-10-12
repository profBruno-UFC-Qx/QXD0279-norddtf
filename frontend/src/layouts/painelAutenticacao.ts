import type { InjectionKey, Ref } from 'vue'

export interface PainelAutenticacao {
  aberto: Readonly<Ref<boolean>>
  abrir: () => void
  alternar: () => void
}

export const CHAVE_PAINEL_AUTENTICACAO: InjectionKey<PainelAutenticacao> =
  Symbol('painelAutenticacao')

export const ID_PARTE_EMAIL = 'autenticacao-parte-email'
