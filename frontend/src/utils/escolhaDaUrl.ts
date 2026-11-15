import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import { TAMANHOS, type EscolhaDoProduto, type ProdutoDaLoja, type Tamanho } from '@/types/produto'

const CHAVE_SEM_TAMANHO = 'unidades'
const INTEIRO = /^\d+$/
const CHAVES_DA_ESCOLHA: string[] = ['cor', CHAVE_SEM_TAMANHO, ...TAMANHOS]

function chaveDoTamanho(tamanho: Tamanho | null) {
  return tamanho ?? CHAVE_SEM_TAMANHO
}

function quantidadeDaQuery(valor: LocationQuery[string] | undefined) {
  return typeof valor === 'string' && INTEIRO.test(valor) ? Number(valor) : 0
}

export function lerEscolha(query: LocationQuery, produto: ProdutoDaLoja): EscolhaDoProduto {
  const cor = produto.cores.find((item) => item.id === query.cor)
  if (!cor) return { corId: null, quantidades: [] }
  return {
    corId: cor.id,
    quantidades: cor.estoque.map(({ tamanho, quantidade }) => ({
      tamanho,
      quantidade: Math.min(quantidadeDaQuery(query[chaveDoTamanho(tamanho)]), quantidade),
    })),
  }
}

export function escreverEscolha(escolha: EscolhaDoProduto): LocationQueryRaw {
  if (!escolha.corId) return {}
  const query: LocationQueryRaw = { cor: escolha.corId }
  for (const { tamanho, quantidade } of escolha.quantidades) {
    if (quantidade > 0) query[chaveDoTamanho(tamanho)] = String(quantidade)
  }
  return query
}

export function mesclarEscolha(query: LocationQuery, escolha: EscolhaDoProduto): LocationQueryRaw {
  const outras = Object.entries(query).filter(([chave]) => !CHAVES_DA_ESCOLHA.includes(chave))
  return { ...Object.fromEntries(outras), ...escreverEscolha(escolha) }
}
