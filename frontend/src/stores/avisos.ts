import { ref } from 'vue'
import { defineStore } from 'pinia'

export type TipoAviso = 'sucesso' | 'erro'

export type Aviso = { id: number; tipo: TipoAviso; mensagem: string }

export const useAvisos = defineStore('avisos', () => {
  const avisos = ref<Aviso[]>([])
  let proximoId = 0

  function avisar(tipo: TipoAviso, mensagem: string) {
    proximoId += 1
    avisos.value.push({ id: proximoId, tipo, mensagem })
  }

  function remover(id: number) {
    avisos.value = avisos.value.filter((aviso) => aviso.id !== id)
  }

  function sucesso(mensagem: string) {
    avisar('sucesso', mensagem)
  }

  function erro(mensagem: string) {
    avisar('erro', mensagem)
  }

  return { avisos, avisar, remover, sucesso, erro }
})
