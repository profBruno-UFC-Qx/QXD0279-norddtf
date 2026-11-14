import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { z } from 'zod'

import { TAMANHOS, type FiltrosProdutos } from '@/types/produto'

const UUID = z.uuid()
const PRECO = /^\d{1,8}(\.\d{1,2})?$/
const PAGINA = /^[1-9]\d{0,5}$/
export const LIMITE_DA_BUSCA = 120

type ValorDaQuery = LocationQuery[string] | undefined

function primeiro(valor: ValorDaQuery) {
  const unico = Array.isArray(valor) ? valor[0] : valor
  return unico ?? ''
}

function lista(valor: ValorDaQuery) {
  return [valor ?? []]
    .flat()
    .flatMap((parte) => (parte ?? '').split(','))
    .filter(Boolean)
}

function preco(valor: ValorDaQuery) {
  const texto = primeiro(valor)
  return PRECO.test(texto) ? texto : undefined
}

function faixaValida(precoMin?: string, precoMax?: string) {
  return !precoMin || !precoMax || Number(precoMin) <= Number(precoMax)
}

export function lerFiltros(query: LocationQuery): FiltrosProdutos {
  const precoMin = preco(query.precoMin)
  const precoMax = preco(query.precoMax)
  const comFaixa = faixaValida(precoMin, precoMax)
  const pagina = primeiro(query.pagina)
  return {
    busca: primeiro(query.busca).trim().slice(0, LIMITE_DA_BUSCA),
    categorias: [
      ...new Set(
        lista(query.categorias)
          .filter((id) => UUID.safeParse(id).success)
          .map((id) => id.toLowerCase()),
      ),
    ],
    tamanhos: TAMANHOS.filter((tamanho) => lista(query.tamanhos).includes(tamanho)),
    precoMin: comFaixa ? precoMin : undefined,
    precoMax: comFaixa ? precoMax : undefined,
    pagina: PAGINA.test(pagina) ? Number(pagina) : 1,
  }
}

export function escreverFiltros(filtros: FiltrosProdutos): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  if (filtros.busca) query.busca = filtros.busca
  if (filtros.categorias.length) query.categorias = filtros.categorias.join(',')
  if (filtros.tamanhos.length) query.tamanhos = filtros.tamanhos.join(',')
  if (filtros.precoMin) query.precoMin = filtros.precoMin
  if (filtros.precoMax) query.precoMax = filtros.precoMax
  if (filtros.pagina > 1) query.pagina = String(filtros.pagina)
  return query
}

export function temFiltro(filtros: FiltrosProdutos) {
  return Boolean(
    filtros.busca ||
    filtros.categorias.length ||
    filtros.tamanhos.length ||
    filtros.precoMin ||
    filtros.precoMax,
  )
}
