import { ErroApi, MENSAGEM_GERAL } from './ErroApi'

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type OpcoesRequisicao = { metodo?: Metodo; corpo?: unknown; sinal?: AbortSignal }

type GanchosDeSessao = { aoNaoAutorizado: () => void; aoAcessoNegado: () => void }

const URL_API = import.meta.env.VITE_API_URL

if (!URL_API) {
  throw new Error('VITE_API_URL não está definida no .env do frontend.')
}

let ganchosDeSessao: GanchosDeSessao | undefined

export function configurarGanchosDeSessao(ganchos: GanchosDeSessao): void {
  ganchosDeSessao = ganchos
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function lerJson(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

function converterErro(status: number, corpo: unknown): ErroApi {
  if (!ehObjeto(corpo)) return new ErroApi(status, MENSAGEM_GERAL)

  const codigo = typeof corpo.code === 'string' ? corpo.code : undefined

  if (status === 400 && codigo === 'VALIDATION_ERROR' && ehObjeto(corpo.errors)) {
    return new ErroApi(status, MENSAGEM_GERAL, codigo, corpo.errors as Record<string, string>)
  }

  if (status >= 400 && status < 500 && codigo && typeof corpo.message === 'string') {
    return new ErroApi(status, corpo.message, codigo)
  }

  return new ErroApi(status, MENSAGEM_GERAL, codigo)
}

export async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { metodo = 'GET', corpo, sinal } = opcoes
  const cabecalhos: Record<string, string> = { Accept: 'application/json' }

  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'

  let resposta: Response
  let texto: string

  try {
    resposta = await fetch(URL_API + caminho, {
      method: metodo,
      headers: cabecalhos,
      credentials: 'include',
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: sinal,
    })
    texto = await resposta.text()
  } catch (erro) {
    if (sinal?.aborted) throw erro
    throw new ErroApi(0, MENSAGEM_GERAL)
  }

  if (resposta.ok) {
    if (resposta.status === 204) return undefined as T
    try {
      return JSON.parse(texto) as T
    } catch {
      throw new ErroApi(resposta.status, MENSAGEM_GERAL)
    }
  }

  const erro = converterErro(resposta.status, lerJson(texto))

  if (erro.status === 401) ganchosDeSessao?.aoNaoAutorizado()
  if (erro.status === 403) ganchosDeSessao?.aoAcessoNegado()

  throw erro
}

export const api = {
  get: <T>(caminho: string, sinal?: AbortSignal) => requisitar<T>(caminho, { sinal }),
  post: <T>(caminho: string, corpo?: unknown, sinal?: AbortSignal) =>
    requisitar<T>(caminho, { metodo: 'POST', corpo, sinal }),
  put: <T>(caminho: string, corpo?: unknown, sinal?: AbortSignal) =>
    requisitar<T>(caminho, { metodo: 'PUT', corpo, sinal }),
  patch: <T>(caminho: string, corpo?: unknown, sinal?: AbortSignal) =>
    requisitar<T>(caminho, { metodo: 'PATCH', corpo, sinal }),
  delete: <T>(caminho: string, sinal?: AbortSignal) =>
    requisitar<T>(caminho, { metodo: 'DELETE', sinal }),
}
