import { z } from 'zod'

import {
  TAMANHOS,
  type CampoDeImagem,
  type CorDetalhada,
  type DadosDaEdicao,
  type DadosDoProduto,
  type EntradaDeEstoque,
  type ImagemEnviada,
  type ProdutoDetalhado,
  type Tamanho,
  type TipoProduto,
} from '@/types/produto'
import { centavosParaDecimal, decimalParaCentavos } from '@/utils/formatacao'

export type CorDoFormulario = Record<CampoDeImagem, ImagemEnviada | null> & {
  idLocal: string
  nome: string
  hex: string
}

export type LinhaDeEstoque = { cor: string; quantidades: (number | null)[] }

export type ValoresDoProduto = {
  tipo: TipoProduto
  nome: string
  preco: string
  descricao: string
  categorias: string[]
  temTamanho: boolean
  cores: CorDoFormulario[]
  estoque: LinhaDeEstoque[]
}

export const IMAGENS_POR_TIPO: Record<TipoProduto, { campo: CampoDeImagem; rotulo: string }[]> = {
  PERSONALIZAVEL: [
    { campo: 'imagemApresentacao', rotulo: 'Apresentação' },
    { campo: 'imagemPersonalizacaoFrente', rotulo: 'Personalização (frente)' },
    { campo: 'imagemPersonalizacaoCostas', rotulo: 'Personalização (costas)' },
  ],
  VENDA_DIRETA: [
    { campo: 'imagemApresentacao', rotulo: 'Apresentação' },
    { campo: 'imagemApresentacaoCostas', rotulo: 'Apresentação (costas)' },
  ],
}

export const CAMPOS_DE_IMAGEM: CampoDeImagem[] = [
  'imagemApresentacao',
  'imagemApresentacaoCostas',
  'imagemPersonalizacaoFrente',
  'imagemPersonalizacaoCostas',
]

const MENSAGENS_DE_IMAGEM: Record<CampoDeImagem, string> = {
  imagemApresentacao: 'Envie a imagem de apresentação.',
  imagemApresentacaoCostas: 'Envie a imagem de apresentação (costas).',
  imagemPersonalizacaoFrente: 'Envie a imagem de personalização (frente).',
  imagemPersonalizacaoCostas: 'Envie a imagem de personalização (costas).',
}

const REGRAS_DE_IMAGEM: Record<
  TipoProduto,
  { obrigatorias: CampoDeImagem[]; proibidas: CampoDeImagem[] }
> = {
  PERSONALIZAVEL: {
    obrigatorias: ['imagemPersonalizacaoFrente'],
    proibidas: ['imagemApresentacaoCostas'],
  },
  VENDA_DIRETA: {
    obrigatorias: [],
    proibidas: ['imagemPersonalizacaoFrente', 'imagemPersonalizacaoCostas'],
  },
}

const PRECO_INVALIDO = 'Informe um preço válido.'
const CATEGORIAS_INVALIDAS = 'Selecione ao menos uma categoria.'
const NOME_DA_COR_INVALIDO = 'Informe o nome da cor.'
const QUANTIDADE_INVALIDA = 'Informe uma quantidade válida.'
const IMAGEM_PROIBIDA = 'Este tipo de produto não usa essa imagem.'

const tipoProduto = z.enum(['PERSONALIZAVEL', 'VENDA_DIRETA'], {
  error: 'Selecione o tipo de produto.',
})

function imagem(campo: CampoDeImagem) {
  return z.object({ chave: z.string(), url: z.string() }, { error: MENSAGENS_DE_IMAGEM[campo] })
}

const corSchema = z.object({
  idLocal: z.string(),
  nome: z
    .string({ error: NOME_DA_COR_INVALIDO })
    .trim()
    .min(1, { error: NOME_DA_COR_INVALIDO })
    .max(30, { error: NOME_DA_COR_INVALIDO }),
  hex: z
    .string({ error: 'Escolha a cor da amostra.' })
    .regex(/^#[0-9A-Fa-f]{6}$/, { error: 'Escolha a cor da amostra.' }),
  imagemApresentacao: imagem('imagemApresentacao'),
  imagemApresentacaoCostas: imagem('imagemApresentacaoCostas').nullable(),
  imagemPersonalizacaoFrente: imagem('imagemPersonalizacaoFrente').nullable(),
  imagemPersonalizacaoCostas: imagem('imagemPersonalizacaoCostas').nullable(),
})

const quantidade = z
  .number({ error: QUANTIDADE_INVALIDA })
  .int({ error: QUANTIDADE_INVALIDA })
  .min(0, { error: QUANTIDADE_INVALIDA })
  .max(99999, { error: QUANTIDADE_INVALIDA })

const camposDoProduto = z.object({
  tipo: tipoProduto,
  nome: z
    .string({ error: 'Informe o nome do produto.' })
    .trim()
    .min(3, { error: 'Informe o nome do produto.' })
    .max(120, { error: 'Informe o nome do produto.' }),
  preco: z.string({ error: PRECO_INVALIDO }).regex(/[1-9]/, { error: PRECO_INVALIDO }),
  descricao: z
    .string({ error: 'A descrição pode ter até 2.000 caracteres.' })
    .trim()
    .max(2000, { error: 'A descrição pode ter até 2.000 caracteres.' }),
  categorias: z
    .array(z.string(), { error: CATEGORIAS_INVALIDAS })
    .min(1, { error: CATEGORIAS_INVALIDAS }),
  temTamanho: z.boolean({ error: 'Informe se o produto tem tamanho.' }),
  cores: z.array(corSchema, { error: 'Cadastre ao menos uma cor.' }),
  estoque: z.array(z.object({ cor: z.string(), quantidades: z.array(quantidade) })),
})

type CorParcial = Partial<CorDoFormulario>

type ProdutoParcial = { tipo?: unknown; temTamanho?: unknown; cores?: unknown; estoque?: unknown }

function coresParciais(cores: unknown) {
  if (!Array.isArray(cores)) return []
  return cores.flatMap((cor: unknown, indice) =>
    typeof cor === 'object' && cor !== null ? [{ indice, cor: cor as CorParcial }] : [],
  )
}

type CoresParciais = ReturnType<typeof coresParciais>

function normalizarNome(nome: string) {
  return nome.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function nomeDaCor(cor: CorParcial) {
  return typeof cor.nome === 'string' ? cor.nome.trim() : ''
}

function conferirImagens(tipo: TipoProduto, cores: CoresParciais, ctx: z.RefinementCtx) {
  const { obrigatorias, proibidas } = REGRAS_DE_IMAGEM[tipo]
  cores.forEach(({ cor, indice }) => {
    for (const campo of obrigatorias) {
      if (cor[campo] == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['cores', indice, campo],
          message: MENSAGENS_DE_IMAGEM[campo],
        })
      }
    }
    for (const campo of proibidas) {
      if (cor[campo] != null) {
        ctx.addIssue({ code: 'custom', path: ['cores', indice, campo], message: IMAGEM_PROIBIDA })
      }
    }
  })
}

function linhasParciais(estoque: unknown) {
  if (!Array.isArray(estoque)) return []
  return estoque.filter(
    (linha: unknown): linha is Partial<LinhaDeEstoque> =>
      typeof linha === 'object' && linha !== null,
  )
}

function conferirEstoque(
  temTamanho: boolean,
  cores: CoresParciais,
  estoque: unknown,
  ctx: z.RefinementCtx,
) {
  const esperadas = temTamanho ? TAMANHOS.length : 1
  const linhas = linhasParciais(estoque)
  cores.forEach(({ cor, indice }) => {
    const linha = linhas.find((candidata) => candidata.cor === cor.idLocal)
    if (Array.isArray(linha?.quantidades) && linha.quantidades.length === esperadas) return
    const nome = nomeDaCor(cor)
    const mensagem = nome ? `Defina o estoque da cor ${nome}.` : 'Defina o estoque da cor.'
    ctx.addIssue({ code: 'custom', path: ['cores', indice, 'estoque'], message: mensagem })
  })
}

function conferirNomesDasCores(
  cores: CoresParciais,
  corAberta: (cor: CorParcial) => boolean,
  ctx: z.RefinementCtx,
) {
  const nomes = cores.map(({ cor }) => normalizarNome(nomeDaCor(cor)))
  cores.forEach(({ cor, indice }, posicao) => {
    const nome = nomes[posicao]
    if (!nome) return
    const aberta = corAberta(cor)
    const repetida = cores.some(({ cor: outra }, outraPosicao) => {
      if (outraPosicao === posicao || nomes[outraPosicao] !== nome) return false
      return aberta || (outraPosicao < posicao && !corAberta(outra))
    })
    if (repetida) {
      ctx.addIssue({
        code: 'custom',
        path: ['cores', indice, 'nome'],
        message: 'Essa cor já foi cadastrada.',
      })
    }
  })
}

const SO_COM_OBJETO = {
  when: ({ value }: { value: unknown }) => typeof value === 'object' && value !== null,
}

export function criarEsquemaProduto(corAberta: (cor: CorParcial) => boolean) {
  return camposDoProduto.superRefine((produto: ProdutoParcial, ctx) => {
    const cores = coresParciais(produto.cores)
    const confirmadas = cores.filter(({ cor }) => !corAberta(cor))
    if (Array.isArray(produto.cores) && confirmadas.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['cores'], message: 'Cadastre ao menos uma cor.' })
    }
    const tipo = tipoProduto.safeParse(produto.tipo)
    if (tipo.success) conferirImagens(tipo.data, cores, ctx)
    if (typeof produto.temTamanho === 'boolean') {
      conferirEstoque(produto.temTamanho, confirmadas, produto.estoque, ctx)
    }
    conferirNomesDasCores(cores, corAberta, ctx)
  }, SO_COM_OBJETO)
}

function entradasDaLinha(
  temTamanho: boolean,
  linha: LinhaDeEstoque | undefined,
): EntradaDeEstoque[] {
  if (!linha) return []
  const tamanhos: (Tamanho | null)[] = temTamanho ? [...TAMANHOS] : [null]
  return tamanhos.map((tamanho, indice) => ({
    tamanho,
    quantidade: linha.quantidades[indice] ?? 0,
  }))
}

export function montarCorpo(valores: ValoresDoProduto): DadosDoProduto {
  return {
    tipo: valores.tipo,
    nome: valores.nome.trim(),
    preco: centavosParaDecimal(valores.preco),
    descricao: valores.descricao.trim() || null,
    categorias: valores.categorias,
    temTamanho: valores.temTamanho,
    cores: valores.cores.map((cor) => ({
      nome: cor.nome.trim(),
      hex: cor.hex,
      imagemApresentacao: cor.imagemApresentacao?.chave ?? null,
      imagemApresentacaoCostas: cor.imagemApresentacaoCostas?.chave ?? null,
      imagemPersonalizacaoFrente: cor.imagemPersonalizacaoFrente?.chave ?? null,
      imagemPersonalizacaoCostas: cor.imagemPersonalizacaoCostas?.chave ?? null,
      estoque: entradasDaLinha(
        valores.temTamanho,
        valores.estoque.find((linha) => linha.cor === cor.idLocal),
      ),
    })),
  }
}

export function montarCorpoDaEdicao(
  valores: ValoresDoProduto,
  coresSalvas: ReadonlySet<string>,
): DadosDaEdicao {
  const { nome, preco, descricao, categorias, temTamanho, cores } = montarCorpo(valores)
  return {
    nome,
    preco,
    descricao,
    categorias,
    temTamanho,
    cores: cores.map((cor, indice) => {
      const idLocal = valores.cores[indice]?.idLocal ?? ''
      return coresSalvas.has(idLocal) ? { id: idLocal, ...cor } : cor
    }),
  }
}

export function corDoDetalhe(cor: CorDetalhada): CorDoFormulario {
  return {
    idLocal: cor.id,
    nome: cor.nome,
    hex: cor.hex,
    imagemApresentacao: cor.imagemApresentacao,
    imagemApresentacaoCostas: cor.imagemApresentacaoCostas,
    imagemPersonalizacaoFrente: cor.imagemPersonalizacaoFrente,
    imagemPersonalizacaoCostas: cor.imagemPersonalizacaoCostas,
  }
}

export function linhaDoDetalhe(cor: CorDetalhada, temTamanho: boolean): LinhaDeEstoque {
  const tamanhos: (Tamanho | null)[] = temTamanho ? [...TAMANHOS] : [null]
  return {
    cor: cor.id,
    quantidades: tamanhos.map(
      (tamanho) => cor.estoque.find((entrada) => entrada.tamanho === tamanho)?.quantidade ?? 0,
    ),
  }
}

export function valoresDoDetalhe(produto: ProdutoDetalhado): ValoresDoProduto {
  return {
    tipo: produto.tipo,
    nome: produto.nome,
    preco: decimalParaCentavos(produto.preco),
    descricao: produto.descricao ?? '',
    categorias: produto.categorias.map((categoria) => categoria.id),
    temTamanho: produto.temTamanho,
    cores: produto.cores.map(corDoDetalhe),
    estoque: produto.cores.map((cor) => linhaDoDetalhe(cor, produto.temTamanho)),
  }
}

export function retratoDoFormulario(valores: ValoresDoProduto) {
  return JSON.stringify({
    tipo: valores.tipo,
    nome: valores.nome.trim(),
    preco: centavosParaDecimal(valores.preco),
    descricao: valores.descricao.trim(),
    categorias: [...valores.categorias].sort(),
    temTamanho: valores.temTamanho,
    cores: valores.cores.map((cor) => ({
      idLocal: cor.idLocal,
      nome: cor.nome.trim(),
      hex: cor.hex.toUpperCase(),
      imagens: CAMPOS_DE_IMAGEM.map((campo) => cor[campo]?.chave ?? null),
      quantidades: valores.estoque.find((linha) => linha.cor === cor.idLocal)?.quantidades ?? null,
    })),
  })
}

const ERRO_DA_COR = /^cores\.(\d+)\.(.+)$/
const ERRO_DE_QUANTIDADE = /^estoque\.(\d+)\.quantidade$/

function caminhoNoFormulario(
  caminho: string,
  enviados: ValoresDoProduto,
  atuais: ValoresDoProduto,
): string | undefined {
  const daCor = ERRO_DA_COR.exec(caminho)
  if (!daCor) return caminho
  const [, indiceEnviado, resto = ''] = daCor
  const idLocal = enviados.cores[Number(indiceEnviado)]?.idLocal
  const indice = atuais.cores.findIndex((cor) => cor.idLocal === idLocal)
  if (indice === -1) return undefined
  const quantidade = ERRO_DE_QUANTIDADE.exec(resto)
  const linha = atuais.estoque.findIndex((candidata) => candidata.cor === idLocal)
  if (quantidade && linha !== -1) return `estoque[${linha}].quantidades[${quantidade[1]}]`
  if (resto.startsWith('estoque')) return `cores[${indice}].estoque`
  return `cores[${indice}].${resto}`
}

export function errosNoFormulario(
  erros: Record<string, string>,
  enviados: ValoresDoProduto,
  atuais: ValoresDoProduto,
) {
  const mapeados: Record<string, string> = {}
  for (const [caminho, mensagem] of Object.entries(erros)) {
    const destino = caminhoNoFormulario(caminho, enviados, atuais)
    if (destino) mapeados[destino] ??= mensagem
  }
  return mapeados
}
