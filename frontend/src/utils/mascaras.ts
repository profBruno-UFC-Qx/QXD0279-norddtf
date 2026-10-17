import { somenteDigitos } from '@/utils/formatacao'

export function mascararTelefone(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 11)
  const ddd = digitos.slice(0, 2)
  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${ddd}`
  if (digitos.length <= 6) return `(${ddd}) ${digitos.slice(2)}`
  if (digitos.length <= 10) return `(${ddd}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return `(${ddd}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

export function mascararCep(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 8)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

export function mascararMoeda(valor: string): string {
  const digitos = somenteDigitos(valor).replace(/^0+/, '').slice(0, 6)
  if (digitos.length === 0) return ''
  const completo = digitos.padStart(3, '0')
  const reais = completo.slice(0, -2).replace(/\B(?=(\d{3})+$)/g, '.')
  return `R$ ${reais},${completo.slice(-2)}`
}
