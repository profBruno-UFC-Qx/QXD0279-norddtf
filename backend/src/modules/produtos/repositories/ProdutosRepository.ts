import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { and, or } from '@prisma/orm-postgres/orm-client';
import { db } from '../../../shared/infra/prisma/db.js';
import type { Models } from '../../../shared/infra/prisma/schema.js';
import { normalizarNome } from '../../categorias/normalizarNome.js';
import { DadosDoProdutoInvalidosError } from '../errors/DadosDoProdutoInvalidosError.js';
import { ProdutoNaoEncontradoError } from '../errors/ProdutoNaoEncontradoError.js';
import { ProdutoVendidoError } from '../errors/ProdutoVendidoError.js';
import {
  CATEGORIAS_INVALIDAS,
  type DadosDaEdicao,
  type DadosDoProduto,
  type FiltrosDaListagem,
} from '../schemas/produtoSchemas.js';

type Preco = Scalars<Models.public_Produto>['preco'];
type Orm = typeof db.orm;
type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Cor = DadosDoProduto['cores'][number];
type CorQueContinua = Cor & { id: string };

export interface EstadoDaEdicao {
  temTamanho: boolean;
  cores: { id: string; nome: string }[];
  coresVendidas: Set<string>;
}

export interface MudancasDaEdicao {
  coresRemovidas: string[];
  trocarVariantes: boolean;
}

export const POR_PAGINA = 12;

const CATEGORIA_DO_PRODUTO = 'produtoCategoria_categoriaId_fkey';
const VARIANTE_DO_ITEM = 'item_produtoVarianteId_fkey';

export class ProdutosRepository {
  async contarCategorias(ids: string[]) {
    const { total } = await db.orm.public.Categoria.where((c) => c.id.in(ids)).aggregate((a) => ({ total: a.count() }));
    return total;
  }

  async criar(dados: DadosDoProduto) {
    return db
      .transaction(async (tx) => {
        const produto = await tx.orm.public.Produto.select('id').create({
          tipo: dados.tipo,
          nome: dados.nome,
          preco: dados.preco as Preco,
          descricao: dados.descricao,
          temTamanho: dados.temTamanho,
          buscaNormalizada: normalizarNome(`${dados.nome} ${dados.descricao ?? ''}`),
        });

        await ligarCategorias(tx.orm, produto.id, dados.categorias);
        await criarCores(tx.orm, produto.id, dados.cores, 0);

        return produto.id;
      })
      .catch(categoriaRemovida);
  }

  async listar({ busca, categorias, precoMin, precoMax, tamanhos, pagina }: FiltrosDaListagem) {
    let consulta = db.orm.public.Produto;
    if (busca) {
      const padrao = padraoDeBusca(busca);
      consulta = consulta.where((p) =>
        or(
          p.buscaNormalizada.like(padrao),
          p.categorias.some((pc) => pc.categoria.some((c) => c.nomeNormalizado.like(padrao))),
        ),
      );
    }
    if (categorias) {
      consulta = consulta.where((p) => p.categorias.some((pc) => pc.categoriaId.in(categorias)));
    }
    if (precoMin) {
      consulta = consulta.where((p) => p.preco.gte(precoMin as Preco));
    }
    if (precoMax) {
      consulta = consulta.where((p) => p.preco.lte(precoMax as Preco));
    }
    if (tamanhos) {
      consulta = consulta.where((p) =>
        p.cores.some((c) => c.variantes.some((v) => and(v.tamanho.in(tamanhos), v.estoque.gt(0)))),
      );
    }

    const [itens, { total }, { min, max }] = await Promise.all([
      consulta
        .select('id', 'nome', 'preco', 'ativo', 'tipo')
        .include('cores', (cores) =>
          cores
            .select('imagemApresentacao')
            .orderBy([(c) => c.posicao.asc(), (c) => c.criadoEm.asc()])
            .limit(1),
        )
        .orderBy([(p) => p.criadoEm.desc(), (p) => p.id.desc()])
        .limit(POR_PAGINA)
        .offset((pagina - 1) * POR_PAGINA)
        .all(),
      consulta.aggregate((a) => ({ total: a.count() })),
      db.orm.public.Produto.aggregate((a) => ({ min: a.min('preco'), max: a.max('preco') })),
    ]);
    return { itens, total, faixaDePreco: min === null ? null : { min, max } };
  }

  async detalhar(id: string) {
    const [produto, categorias, coresVendidas] = await Promise.all([
      db.orm.public.Produto.where({ id })
        .select('id', 'tipo', 'nome', 'preco', 'descricao', 'temTamanho', 'ativo', 'criadoEm', 'atualizadoEm')
        .include('cores', (cores) =>
          cores
            .select(
              'id',
              'nome',
              'hex',
              'imagemApresentacao',
              'imagemApresentacaoCostas',
              'imagemPersonalizacaoFrente',
              'imagemPersonalizacaoCostas',
            )
            .include('variantes', (variantes) => variantes.select('tamanho', 'estoque'))
            .orderBy([(c) => c.posicao.asc(), (c) => c.criadoEm.asc()]),
        )
        .first(),
      db.orm.public.Categoria.where((c) => c.produtos.some((pc) => pc.produtoId.eq(id)))
        .select('id', 'nome')
        .orderBy((c) => c.nomeNormalizado.asc())
        .all(),
      buscarCoresVendidas(db.orm, id),
    ]);

    if (!produto) {
      return null;
    }
    return { ...produto, categorias, coresVendidas };
  }

  async atualizar(id: string, dados: DadosDaEdicao, planejar: (estado: EstadoDaEdicao) => MudancasDaEdicao) {
    const continuam = dados.cores.filter((cor): cor is CorQueContinua => cor.id !== undefined);
    const novas = dados.cores.filter((cor) => cor.id === undefined);

    await db
      .transaction(async (tx) => {
        const estado = (await bloquearProduto(tx, id)) && (await lerEstadoDaEdicao(tx.orm, id));
        if (!estado) {
          throw new ProdutoNaoEncontradoError();
        }
        const { coresRemovidas, trocarVariantes } = planejar(estado);

        await tx.orm.public.Produto.where({ id }).updateAndCount({
          nome: dados.nome,
          preco: dados.preco as Preco,
          descricao: dados.descricao,
          temTamanho: dados.temTamanho,
          buscaNormalizada: normalizarNome(`${dados.nome} ${dados.descricao ?? ''}`),
        });

        await tx.orm.public.ProdutoCategoria.where({ produtoId: id }).deleteAndCount();
        await ligarCategorias(tx.orm, id, dados.categorias);

        await apagarCores(tx.orm, coresRemovidas);
        await atualizarCores(tx.orm, continuam);
        if (trocarVariantes) {
          await trocarEstoque(tx.orm, continuam);
        } else {
          await atualizarEstoque(tx.orm, continuam);
        }

        const ultima = await tx.orm.public.ProdutoCor.where({ produtoId: id })
          .select('posicao')
          .orderBy((c) => c.posicao.desc())
          .first();
        await criarCores(tx.orm, id, novas, (ultima?.posicao ?? -1) + 1);
      })
      .catch(async (error: unknown) => {
        if (vendeuDuranteAGravacao(error)) {
          const estado = await lerEstadoDaEdicao(db.orm, id);
          if (estado) {
            planejar(estado);
          }
        }
        categoriaRemovida(error);
      });
  }

  async mudarSituacao(id: string, ativo: boolean) {
    return db.orm.public.Produto.where({ id }).select('id', 'ativo').update({ ativo });
  }

  async remover(id: string) {
    return db
      .transaction(async (tx) => {
        if (!(await bloquearProduto(tx, id))) {
          return false;
        }
        if ((await buscarCoresVendidas(tx.orm, id)).size > 0) {
          throw new ProdutoVendidoError();
        }

        const cores = await tx.orm.public.ProdutoCor.where({ produtoId: id }).select('id').all();
        await apagarCores(tx.orm, cores.map((cor) => cor.id));
        await tx.orm.public.ProdutoCategoria.where({ produtoId: id }).deleteAndCount();
        await tx.orm.public.Produto.where({ id }).deleteAndCount();
        return true;
      })
      .catch(produtoVendido);
  }
}

function padraoDeBusca(termo: string) {
  return `%${normalizarNome(termo).replace(/[\\%_]/g, (caractere) => `\\${caractere}`)}%`;
}

async function bloquearProduto(tx: Transacao, id: string) {
  const { affectedRows } = await tx.execute(
    db.raw.sql`SELECT 1 FROM "produto" WHERE "id" = ${id}::uuid FOR UPDATE`.affectedCount().build(),
  );
  return affectedRows > 0;
}

async function lerEstadoDaEdicao(orm: Orm, id: string): Promise<EstadoDaEdicao | null> {
  const [produto, coresVendidas] = await Promise.all([
    orm.public.Produto.where({ id })
      .select('temTamanho')
      .include('cores', (cores) => cores.select('id', 'nome'))
      .first(),
    buscarCoresVendidas(orm, id),
  ]);
  return produto && { ...produto, coresVendidas };
}

async function buscarCoresVendidas(orm: Orm, produtoId: string) {
  const cores = await orm.public.ProdutoCor.where({ produtoId })
    .where((c) => c.variantes.some((v) => v.itens.some()))
    .select('id')
    .all();
  return new Set(cores.map((cor) => cor.id));
}

async function ligarCategorias(orm: Orm, produtoId: string, categorias: string[]) {
  await orm.public.ProdutoCategoria.createAndCount(categorias.map((categoriaId) => ({ produtoId, categoriaId })));
}

function camposDaCor(cor: Cor) {
  return {
    nome: cor.nome,
    nomeNormalizado: normalizarNome(cor.nome),
    hex: cor.hex,
    imagemApresentacao: cor.imagemApresentacao,
    imagemApresentacaoCostas: cor.imagemApresentacaoCostas,
    imagemPersonalizacaoFrente: cor.imagemPersonalizacaoFrente,
    imagemPersonalizacaoCostas: cor.imagemPersonalizacaoCostas,
  };
}

async function criarVariantes(orm: Orm, produtoCorId: string, estoque: Cor['estoque']) {
  await orm.public.ProdutoVariante.createAndCount(
    estoque.map(({ tamanho, quantidade }) => ({ produtoCorId, tamanho, estoque: quantidade })),
  );
}

async function criarCores(orm: Orm, produtoId: string, cores: Cor[], primeiraPosicao: number) {
  for (const [indice, cor] of cores.entries()) {
    const criada = await orm.public.ProdutoCor.select('id').create({
      produtoId,
      posicao: primeiraPosicao + indice,
      ...camposDaCor(cor),
    });
    await criarVariantes(orm, criada.id, cor.estoque);
  }
}

async function apagarCores(orm: Orm, ids: string[]) {
  if (ids.length === 0) {
    return;
  }
  await apagarVariantes(orm, ids);
  await orm.public.ProdutoCor.where((c) => c.id.in(ids)).deleteAndCount();
}

async function atualizarCores(orm: Orm, cores: CorQueContinua[]) {
  for (const cor of cores) {
    await orm.public.ProdutoCor.where({ id: cor.id }).updateAndCount({ nomeNormalizado: cor.id });
  }
  for (const cor of cores) {
    await orm.public.ProdutoCor.where({ id: cor.id }).updateAndCount(camposDaCor(cor));
  }
}

async function trocarEstoque(orm: Orm, cores: CorQueContinua[]) {
  await apagarVariantes(orm, cores.map((cor) => cor.id));
  for (const cor of cores) {
    await criarVariantes(orm, cor.id, cor.estoque);
  }
}

async function apagarVariantes(orm: Orm, produtoCorIds: string[]) {
  if (produtoCorIds.length === 0) {
    return;
  }
  await orm.public.ProdutoVariante.where((v) => v.produtoCorId.in(produtoCorIds)).deleteAndCount();
}

async function atualizarEstoque(orm: Orm, cores: CorQueContinua[]) {
  for (const cor of cores) {
    for (const { tamanho, quantidade } of cor.estoque) {
      await orm.public.ProdutoVariante.where({ produtoCorId: cor.id, tamanho }).updateAndCount({ estoque: quantidade });
    }
  }
}

export type ProdutoDetalhado = NonNullable<Awaited<ReturnType<ProdutosRepository['detalhar']>>>;

function categoriaRemovida(error: unknown): never {
  if (violou(error, '23503', CATEGORIA_DO_PRODUTO)) {
    throw new DadosDoProdutoInvalidosError({ categorias: CATEGORIAS_INVALIDAS });
  }
  throw error;
}

function produtoVendido(error: unknown): never {
  if (vendeuDuranteAGravacao(error)) {
    throw new ProdutoVendidoError();
  }
  throw error;
}

function vendeuDuranteAGravacao(error: unknown) {
  return violou(error, '23503', VARIANTE_DO_ITEM);
}

function violou(error: unknown, sqlStateEsperado: string, constraintEsperada: string) {
  if (!(error instanceof Error)) {
    return false;
  }
  const { sqlState, constraint } = error as Error & { sqlState?: string; constraint?: string };
  return sqlState === sqlStateEsperado && constraint === constraintEsperada;
}
