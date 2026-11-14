import type { Categoria } from '@/types/categoria'
import type { FaixaDePreco, FiltrosProdutos } from '@/types/produto'
import { formatarMoeda } from '@/utils/formatacao'

export type EtiquetaDeFiltro = { chave: string; texto: string; sem: Partial<FiltrosProdutos> }

function textoDaFaixa({ precoMin, precoMax }: FiltrosProdutos, faixa?: FaixaDePreco | null) {
  return [precoMin ?? faixa?.min, precoMax ?? faixa?.max]
    .filter((preco) => preco !== undefined)
    .map((preco) => formatarMoeda(preco))
    .join(' a ')
}

export function etiquetasDosFiltros(
  filtros: FiltrosProdutos,
  categorias: Categoria[],
  faixa?: FaixaDePreco | null,
) {
  const nomes = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]))
  const lista: EtiquetaDeFiltro[] = filtros.categorias.flatMap((id) => {
    const nome = nomes.get(id)
    if (!nome) return []
    return [
      {
        chave: id,
        texto: nome,
        sem: { categorias: filtros.categorias.filter((outro) => outro !== id) },
      },
    ]
  })
  if (filtros.precoMin || filtros.precoMax) {
    lista.push({
      chave: 'preco',
      texto: textoDaFaixa(filtros, faixa),
      sem: { precoMin: undefined, precoMax: undefined },
    })
  }
  filtros.tamanhos.forEach((tamanho) => {
    lista.push({
      chave: tamanho,
      texto: `Tamanho ${tamanho}`,
      sem: { tamanhos: filtros.tamanhos.filter((outro) => outro !== tamanho) },
    })
  })
  return lista
}
