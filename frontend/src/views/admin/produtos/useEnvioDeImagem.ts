import { computed, shallowReactive } from 'vue'

import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { enviarImagem } from '@/api/produtos'
import type { CampoDeImagem, ImagemEnviada } from '@/types/produto'

const FORMATO_NAO_SUPORTADO = 'Formato não suportado. Envie PNG, JPEG ou WebP de até 5 MB.'

const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

export type EnvioDeImagem =
  { estado: 'enviando'; controlador: AbortController } | { estado: 'erro'; mensagem: string }

function chaveDoQuadro(cor: string, campo: CampoDeImagem) {
  return `${cor}:${campo}`
}

function arquivoAceito(arquivo: File) {
  return TIPOS_ACEITOS.includes(arquivo.type) && arquivo.size <= TAMANHO_MAXIMO
}

function mensagemDoErro(erro: unknown) {
  if (erro instanceof ErroApi && erro.codigo === 'ARQUIVO_INVALIDO') return erro.mensagem
  return MENSAGEM_GERAL
}

export function useEnvioDeImagem() {
  const envios = shallowReactive(new Map<string, EnvioDeImagem>())

  const enviando = computed(() => [...envios.values()].some((envio) => envio.estado === 'enviando'))

  function envioDe(cor: string, campo: CampoDeImagem) {
    return envios.get(chaveDoQuadro(cor, campo))
  }

  function enviandoNaCor(cor: string) {
    return [...envios].some(
      ([chave, envio]) => chave.startsWith(`${cor}:`) && envio.estado === 'enviando',
    )
  }

  function comErroNaCor(cor: string) {
    return [...envios].some(
      ([chave, envio]) => chave.startsWith(`${cor}:`) && envio.estado === 'erro',
    )
  }

  function descartar(chave: string) {
    const envio = envios.get(chave)
    if (envio?.estado === 'enviando') envio.controlador.abort()
    envios.delete(chave)
  }

  async function enviar(
    cor: string,
    campo: CampoDeImagem,
    arquivo: File,
    aoEnviar: (imagem: ImagemEnviada) => void,
  ) {
    const chave = chaveDoQuadro(cor, campo)
    descartar(chave)
    if (!arquivoAceito(arquivo)) {
      envios.set(chave, { estado: 'erro', mensagem: FORMATO_NAO_SUPORTADO })
      return
    }
    const controlador = new AbortController()
    const envio: EnvioDeImagem = { estado: 'enviando', controlador }
    envios.set(chave, envio)
    try {
      const imagem = await enviarImagem(arquivo, controlador.signal)
      if (envios.get(chave) !== envio) return
      envios.delete(chave)
      aoEnviar(imagem)
    } catch (erro) {
      if (envios.get(chave) !== envio) return
      if (erro instanceof ErroApi && (erro.status === 401 || erro.status === 403)) {
        envios.delete(chave)
        return
      }
      envios.set(chave, { estado: 'erro', mensagem: mensagemDoErro(erro) })
    }
  }

  function descartarQuadro(cor: string, campo: CampoDeImagem) {
    descartar(chaveDoQuadro(cor, campo))
  }

  function descartarCor(cor: string) {
    for (const chave of envios.keys()) {
      if (chave.startsWith(`${cor}:`)) descartar(chave)
    }
  }

  function descartarTudo() {
    for (const chave of envios.keys()) descartar(chave)
  }

  return {
    enviando,
    envioDe,
    enviandoNaCor,
    comErroNaCor,
    enviar,
    descartarQuadro,
    descartarCor,
    descartarTudo,
  }
}
