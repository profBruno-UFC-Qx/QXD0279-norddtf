export const MENSAGEM_GERAL = 'Não foi possível concluir agora. Tente novamente.'

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly mensagem: string,
    readonly codigo?: string,
    readonly erros?: Record<string, string>,
  ) {
    super(mensagem)
  }
}
