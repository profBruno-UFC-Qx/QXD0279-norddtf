import { useAvisos } from '@/stores/avisos'
import type { Material } from '@/types/material'
import type { EscolhaDoProduto, ProdutoDaLoja } from '@/types/produto'

const TELA_PROVISORIA = 'Esta tela chega numa próxima fase.'
const SACOLA_PROVISORIA = 'A sacola chega numa próxima fase.'

export function personalizar(_produto: ProdutoDaLoja, _escolha: EscolhaDoProduto) {
  useAvisos().informacao(TELA_PROVISORIA)
}

export function adicionarASacola(_produto: ProdutoDaLoja, _escolha: EscolhaDoProduto) {
  useAvisos().informacao(SACOLA_PROVISORIA)
}

export function montarFolha(_material: Material) {
  useAvisos().informacao(TELA_PROVISORIA)
}

export function enviarArte(_arquivo: File) {
  useAvisos().informacao(TELA_PROVISORIA)
}
