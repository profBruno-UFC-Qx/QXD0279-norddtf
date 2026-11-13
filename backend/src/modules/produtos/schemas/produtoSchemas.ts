import { z } from 'zod';
import { normalizarNome } from '../../categorias/normalizarNome.js';
import { FORMATO_DA_CHAVE } from '../../imagens/chaveDeImagem.js';

const PRECO_INVALIDO = 'Informe um preço válido.';
export const CATEGORIAS_INVALIDAS = 'Selecione ao menos uma categoria.';
const CORES_INVALIDAS = 'Cadastre ao menos uma cor.';
const NOME_DA_COR_INVALIDO = 'Informe o nome da cor.';
const QUANTIDADE_INVALIDA = 'Informe uma quantidade válida.';
export const COR_NAO_ENCONTRADA = 'Cor não encontrada.';

export const TAMANHOS = ['P', 'M', 'G', 'GG', 'G1', 'G2'] as const;

export type Tamanho = (typeof TAMANHOS)[number];

export const CAMPOS_DE_IMAGEM = [
  'imagemApresentacao',
  'imagemApresentacaoCostas',
  'imagemPersonalizacaoFrente',
  'imagemPersonalizacaoCostas',
] as const;

export type CampoDeImagem = (typeof CAMPOS_DE_IMAGEM)[number];

export const MENSAGENS_DE_IMAGEM: Record<CampoDeImagem, string> = {
  imagemApresentacao: 'Envie a imagem de apresentação.',
  imagemApresentacaoCostas: 'Envie a imagem de apresentação (costas).',
  imagemPersonalizacaoFrente: 'Envie a imagem de personalização (frente).',
  imagemPersonalizacaoCostas: 'Envie a imagem de personalização (costas).',
};

const IMAGEM_PROIBIDA = 'Este tipo de produto não usa essa imagem.';

export const idDoProduto = z.uuid();

const tipoProduto = z.enum(['PERSONALIZAVEL', 'VENDA_DIRETA'], { error: 'Selecione o tipo de produto.' });

export type TipoProduto = z.infer<typeof tipoProduto>;

const IMAGENS_POR_TIPO: Record<TipoProduto, { obrigatorias: CampoDeImagem[]; proibidas: CampoDeImagem[] }> = {
  PERSONALIZAVEL: {
    obrigatorias: ['imagemPersonalizacaoFrente'],
    proibidas: ['imagemApresentacaoCostas'],
  },
  VENDA_DIRETA: {
    obrigatorias: [],
    proibidas: ['imagemPersonalizacaoFrente', 'imagemPersonalizacaoCostas'],
  },
};

function imagem(campo: CampoDeImagem) {
  const mensagem = MENSAGENS_DE_IMAGEM[campo];
  return z.string({ error: mensagem }).regex(FORMATO_DA_CHAVE, { error: mensagem });
}

function imagemOpcional(campo: CampoDeImagem) {
  return imagem(campo)
    .nullish()
    .transform((chave) => chave ?? null);
}

const entradaDeEstoque = z.object(
  {
    tamanho: z.enum(TAMANHOS, { error: QUANTIDADE_INVALIDA }).nullable(),
    quantidade: z
      .number({ error: QUANTIDADE_INVALIDA })
      .int({ error: QUANTIDADE_INVALIDA })
      .min(0, { error: QUANTIDADE_INVALIDA })
      .max(99999, { error: QUANTIDADE_INVALIDA }),
  },
  { error: QUANTIDADE_INVALIDA },
);

const corSchema = z.object(
  {
    nome: z
      .string({ error: NOME_DA_COR_INVALIDO })
      .trim()
      .min(1, { error: NOME_DA_COR_INVALIDO })
      .max(30, { error: NOME_DA_COR_INVALIDO }),
    hex: z.string({ error: 'Escolha a cor da amostra.' }).regex(/^#[0-9A-Fa-f]{6}$/, { error: 'Escolha a cor da amostra.' }),
    imagemApresentacao: imagem('imagemApresentacao'),
    imagemApresentacaoCostas: imagemOpcional('imagemApresentacaoCostas'),
    imagemPersonalizacaoFrente: imagemOpcional('imagemPersonalizacaoFrente'),
    imagemPersonalizacaoCostas: imagemOpcional('imagemPersonalizacaoCostas'),
    estoque: z.array(entradaDeEstoque, { error: QUANTIDADE_INVALIDA }).nullish(),
  },
  { error: CORES_INVALIDAS },
);

type Cor = z.output<typeof corSchema>;

type CorParcial = Record<string, unknown>;

function coresParciais(cores: unknown) {
  if (!Array.isArray(cores)) {
    return [];
  }
  return cores.flatMap((cor: unknown, indice) => {
    const parcial = z.record(z.string(), z.unknown()).safeParse(cor);
    return parcial.success ? [{ indice, cor: parcial.data }] : [];
  });
}

function ehUuid(id: string) {
  return z.uuid().safeParse(id).success;
}

const camposDoProduto = z.object({
  tipo: tipoProduto,
  nome: z
    .string({ error: 'Informe o nome do produto.' })
    .trim()
    .min(3, { error: 'Informe o nome do produto.' })
    .max(120, { error: 'Informe o nome do produto.' }),
  preco: z
    .string({ error: PRECO_INVALIDO })
    .trim()
    .regex(/^\d{1,5}(\.\d{1,2})?$/, { error: PRECO_INVALIDO })
    .refine((preco) => !/^0+(\.0{1,2})?$/.test(preco), { error: PRECO_INVALIDO }),
  descricao: z
    .string({ error: 'A descrição pode ter até 2.000 caracteres.' })
    .trim()
    .max(2000, { error: 'A descrição pode ter até 2.000 caracteres.' })
    .nullish()
    .transform((descricao) => descricao || null),
  categorias: z
    .array(z.string({ error: CATEGORIAS_INVALIDAS }), { error: CATEGORIAS_INVALIDAS })
    .min(1, { error: CATEGORIAS_INVALIDAS })
    .refine((ids) => ids.every(ehUuid) && new Set(ids).size === ids.length, { error: CATEGORIAS_INVALIDAS }),
  temTamanho: z.boolean({ error: 'Informe se o produto tem tamanho.' }),
  cores: z.array(corSchema, { error: CORES_INVALIDAS }).min(1, { error: CORES_INVALIDAS }),
});

export type DadosDoProduto = Omit<z.output<typeof camposDoProduto>, 'cores'> & {
  cores: (Omit<Cor, 'estoque'> & { estoque: NonNullable<Cor['estoque']> })[];
};

const camposDaEdicao = camposDoProduto.omit({ tipo: true }).extend({
  cores: z
    .array(
      corSchema.extend({
        id: z
          .uuid({ error: COR_NAO_ENCONTRADA })
          .nullish()
          .transform((id) => id ?? undefined),
      }),
      { error: CORES_INVALIDAS },
    )
    .min(1, { error: CORES_INVALIDAS }),
});

export type DadosDaEdicao = Omit<DadosDoProduto, 'tipo' | 'cores'> & {
  cores: (DadosDoProduto['cores'][number] & { id?: string })[];
};

const SO_COM_OBJETO = { when: ({ value }: { value: unknown }) => typeof value === 'object' && value !== null };

function conferirRegrasCruzadas(produto: { temTamanho: unknown; cores: unknown }, tipo: unknown, ctx: z.RefinementCtx) {
  const cores = coresParciais(produto.cores);
  const tipoValido = tipoProduto.safeParse(tipo);
  if (tipoValido.success) {
    conferirImagens(tipoValido.data, cores, ctx);
  }
  if (typeof produto.temTamanho === 'boolean') {
    conferirEstoque(produto.temTamanho, cores, ctx);
  }
  conferirNomesDasCores(cores, ctx);
}

export const produtoSchema = camposDoProduto
  .superRefine((produto, ctx) => conferirRegrasCruzadas(produto, produto.tipo, ctx), SO_COM_OBJETO)
  .transform((produto) => produto as DadosDoProduto);

export function edicaoDoProdutoSchema(tipo: TipoProduto) {
  return camposDaEdicao
    .superRefine((produto, ctx) => conferirRegrasCruzadas(produto, tipo, ctx), SO_COM_OBJETO)
    .transform((produto) => produto as DadosDaEdicao);
}

export const situacaoSchema = z.object({
  ativo: z.boolean({ error: 'Informe a situação.' }),
});

const PRECO_DO_FILTRO = /^\d{1,8}(\.\d{1,2})?$/;
const BUSCA_INVALIDA = 'A busca pode ter até 120 caracteres.';
const CATEGORIAS_DO_FILTRO_INVALIDAS = 'Selecione categorias válidas.';
const TAMANHOS_INVALIDOS = 'Selecione tamanhos válidos.';
const PAGINA_INVALIDA = 'Informe uma página válida.';

function vazioComoAusente<T extends z.ZodType>(schema: T) {
  return z.preprocess((valor) => (valor === '' ? undefined : valor), schema.optional());
}

function listaDoFiltro<T extends z.ZodType<unknown, string>>(item: T, mensagem: string) {
  return vazioComoAusente(
    z.union([z.string(), z.array(z.string())], { error: mensagem }).transform((valor, ctx) => {
      const lista = z.array(item).safeParse([valor].flat().flatMap((parte) => parte.split(',')));
      if (!lista.success) {
        ctx.addIssue({ code: 'custom', message: mensagem });
        return z.NEVER;
      }
      return lista.data;
    }),
  );
}

const precoDoFiltro = vazioComoAusente(z.string({ error: PRECO_INVALIDO }).regex(PRECO_DO_FILTRO, { error: PRECO_INVALIDO }));

function precoValido(preco: string | undefined): preco is string {
  return preco !== undefined && PRECO_DO_FILTRO.test(preco);
}

export const filtrosDaListagemSchema = z
  .object({
    busca: z
      .string({ error: 'Informe uma busca válida.' })
      .trim()
      .max(120, { error: BUSCA_INVALIDA })
      .optional()
      .transform((busca) => busca || undefined),
    categorias: listaDoFiltro(z.uuid(), CATEGORIAS_DO_FILTRO_INVALIDAS),
    precoMin: precoDoFiltro,
    precoMax: precoDoFiltro,
    tamanhos: listaDoFiltro(z.enum(TAMANHOS), TAMANHOS_INVALIDOS),
    pagina: z.coerce
      .number({ error: PAGINA_INVALIDA })
      .int({ error: PAGINA_INVALIDA })
      .min(1, { error: PAGINA_INVALIDA })
      .default(1),
  })
  .refine(
    ({ precoMin, precoMax }) => !precoValido(precoMin) || !precoValido(precoMax) || Number(precoMin) <= Number(precoMax),
    { error: 'O preço mínimo não pode ser maior que o máximo.', path: ['precoMin'] },
  );

export type FiltrosDaListagem = z.output<typeof filtrosDaListagemSchema>;

type CoresParciais = ReturnType<typeof coresParciais>;

function conferirImagens(tipo: TipoProduto, cores: CoresParciais, ctx: z.RefinementCtx) {
  const { obrigatorias, proibidas } = IMAGENS_POR_TIPO[tipo];
  cores.forEach(({ cor, indice }) => {
    for (const campo of obrigatorias) {
      if (cor[campo] == null) {
        ctx.addIssue({ code: 'custom', path: ['cores', indice, campo], message: MENSAGENS_DE_IMAGEM[campo] });
      }
    }
    for (const campo of proibidas) {
      if (cor[campo] != null) {
        ctx.addIssue({ code: 'custom', path: ['cores', indice, campo], message: IMAGEM_PROIBIDA });
      }
    }
  });
}

function nomeDaCor(cor: CorParcial) {
  return typeof cor.nome === 'string' ? cor.nome.trim() : '';
}

function conferirEstoque(temTamanho: boolean, cores: CoresParciais, ctx: z.RefinementCtx) {
  const esperados: (Tamanho | null)[] = temTamanho ? [...TAMANHOS] : [null];
  cores.forEach(({ cor, indice }) => {
    if (estoqueCompleto(cor.estoque, esperados)) {
      return;
    }
    const nome = nomeDaCor(cor);
    const mensagem = nome ? `Defina o estoque da cor ${nome}.` : 'Defina o estoque da cor.';
    ctx.addIssue({ code: 'custom', path: ['cores', indice, 'estoque'], message: mensagem });
  });
}

function estoqueCompleto(estoque: unknown, esperados: (Tamanho | null)[]) {
  const entradas = z.array(z.object({ tamanho: z.unknown() })).safeParse(estoque);
  if (!entradas.success || entradas.data.length !== esperados.length) {
    return false;
  }
  const tamanhos = new Set(entradas.data.map((entrada) => entrada.tamanho));
  return tamanhos.size === esperados.length && esperados.every((tamanho) => tamanhos.has(tamanho));
}

function conferirNomesDasCores(cores: CoresParciais, ctx: z.RefinementCtx) {
  const vistos = new Set<string>();
  cores.forEach(({ cor, indice }) => {
    const nome = normalizarNome(nomeDaCor(cor));
    if (!nome) {
      return;
    }
    if (vistos.has(nome)) {
      ctx.addIssue({ code: 'custom', path: ['cores', indice, 'nome'], message: 'Essa cor já foi cadastrada.' });
      return;
    }
    vistos.add(nome);
  });
}
