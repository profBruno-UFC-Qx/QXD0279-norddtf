export function mensagemDeEspera(segundos: number): string {
  const minutos = Math.ceil(segundos / 60)
  if (minutos === 1) return 'Muitas tentativas. Tente novamente em 1 minuto.'
  return `Muitas tentativas. Tente novamente em ${minutos} minutos.`
}
