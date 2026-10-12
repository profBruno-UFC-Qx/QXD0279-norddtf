import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { api } from '@/api/http'
import { useAvisos } from '@/stores/avisos'
import type { Perfil, TipoPerfil, UsuarioSessao } from '@/types/usuario'
import { destinoPadraoPorPerfil } from '@/utils/destino'

const perfilPorTipo: Record<TipoPerfil, Perfil> = { USER: 'cliente', ADMIN: 'admin' }

const destinoDepoisDeSairPorPerfil: Record<Perfil, string> = {
  visitante: '/',
  cliente: '/',
  admin: '/login',
}

export const useSessao = defineStore('sessao', () => {
  const usuario = ref<UsuarioSessao | null>(null)
  const mensagemLogin = ref<string | null>(null)
  let carga: Promise<void> | undefined

  const perfil = computed<Perfil>(() =>
    usuario.value ? perfilPorTipo[usuario.value.tipoPerfil] : 'visitante',
  )

  const destinoPadrao = computed(() => destinoPadraoPorPerfil[perfil.value])

  async function buscarUsuario() {
    try {
      const { id, nome, email, tipoPerfil } = await api.get<UsuarioSessao>('/me')
      usuario.value = { id, nome, email, tipoPerfil }
    } catch (erro) {
      usuario.value = null
      if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 404)) return
      useAvisos().erro(MENSAGEM_GERAL)
    }
  }

  function carregar(): Promise<void> {
    carga ??= buscarUsuario()
    return carga
  }

  function definirUsuario({ id, nome, email, tipoPerfil }: UsuarioSessao) {
    usuario.value = { id, nome, email, tipoPerfil }
  }

  function limpar() {
    usuario.value = null
  }

  async function entrar(email: string, senha: string) {
    definirUsuario(await api.post<UsuarioSessao>('/auth/login', { email, senha }))
  }

  async function sair(): Promise<string> {
    const destino = destinoDepoisDeSairPorPerfil[perfil.value]
    await api.post('/auth/logout')
    limpar()
    return destino
  }

  function expirar() {
    limpar()
    mensagemLogin.value = 'Sua sessão expirou. Entre novamente.'
  }

  function consumirMensagemLogin(): string | null {
    const mensagem = mensagemLogin.value
    mensagemLogin.value = null
    return mensagem
  }

  return {
    usuario,
    mensagemLogin,
    perfil,
    destinoPadrao,
    carregar,
    definirUsuario,
    limpar,
    entrar,
    sair,
    expirar,
    consumirMensagemLogin,
  }
})
