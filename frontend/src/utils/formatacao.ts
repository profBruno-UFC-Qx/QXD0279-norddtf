const FUSO = 'America/Fortaleza'

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function formatarMoeda(valor: string | number): string {
  return formatoMoeda.format(valor as number | Intl.StringNumericLiteral)
}

export function formatarData(iso: string): string {
  return formatoData.format(new Date(iso))
}

export function formatarDataHora(iso: string): string {
  const partes = Object.fromEntries(
    formatoDataHora.formatToParts(new Date(iso)).map((parte) => [parte.type, parte.value]),
  )
  return `${partes.day}/${partes.month}/${partes.year} às ${partes.hour}:${partes.minute}`
}

export function formatarTelefone(valor: string): string {
  const digitos = somenteDigitos(valor)
  if (digitos.length === 11) return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (digitos.length === 10) return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return valor
}

export function formatarCep(valor: string): string {
  const digitos = somenteDigitos(valor)
  if (digitos.length === 8) return digitos.replace(/(\d{5})(\d{3})/, '$1-$2')
  return valor
}
