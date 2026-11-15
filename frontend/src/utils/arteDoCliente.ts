export const ARTE_INVALIDA = 'Formato não suportado. Envie PNG, JPEG ou SVG de até 10 MB.'
export const EXTENSOES_DA_ARTE = '.png,.jpg,.jpeg,.svg'

const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/svg+xml']
const EXTENSAO_ACEITA = /\.(png|jpe?g|svg)$/i
const TAMANHO_MAXIMO = 10 * 1024 * 1024

export function conferirArteDoCliente(arquivo: File) {
  const tipoAceito = arquivo.type === '' || TIPOS_ACEITOS.includes(arquivo.type)
  return (
    tipoAceito &&
    EXTENSAO_ACEITA.test(arquivo.name) &&
    arquivo.size > 0 &&
    arquivo.size <= TAMANHO_MAXIMO
  )
}
