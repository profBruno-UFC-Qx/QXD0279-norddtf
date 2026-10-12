const MENSAGEM_GOOGLE_PADRAO = 'Não foi possível entrar com o Google. Tente novamente.'

const mensagemPorCodigoGoogle = new Map([
  ['access_denied', 'Você cancelou o login com o Google.'],
  ['internal_error', 'Não foi possível entrar agora. Tente novamente.'],
])

export function mensagemDoGoogle(codigo: string): string {
  return mensagemPorCodigoGoogle.get(codigo) ?? MENSAGEM_GOOGLE_PADRAO
}

export function mensagemDeEspera(segundos: number): string {
  const minutos = Math.ceil(segundos / 60)
  if (minutos === 1) return 'Muitas tentativas. Tente novamente em 1 minuto.'
  return `Muitas tentativas. Tente novamente em ${minutos} minutos.`
}
