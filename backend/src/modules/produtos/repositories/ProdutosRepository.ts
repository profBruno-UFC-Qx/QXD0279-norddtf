import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { db } from '../../../shared/infra/prisma/db.js';
import type { Models } from '../../../shared/infra/prisma/schema.js';
import { normalizarNome } from '../../categorias/normalizarNome.js';
import { DadosDoProdutoInvalidosError } from '../errors/DadosDoProdutoInvalidosError.js';
import { CATEGORIAS_INVALIDAS, type DadosDoProduto } from '../schemas/produtoSchemas.js';

type Preco = Scalars<Models.public_Produto>['preco'];

const CATEGORIA_DO_PRODUTO = 'produtoCategoria_categoriaId_fkey';

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

        await tx.orm.public.ProdutoCategoria.createAndCount(
          dados.categorias.map((categoriaId) => ({ produtoId: produto.id, categoriaId })),
        );

        for (const [posicao, cor] of dados.cores.entries()) {
          const criada = await tx.orm.public.ProdutoCor.select('id').create({
            produtoId: produto.id,
            posicao,
            nome: cor.nome,
            nomeNormalizado: normalizarNome(cor.nome),
            hex: cor.hex,
            imagemApresentacao: cor.imagemApresentacao,
            imagemApresentacaoCostas: cor.imagemApresentacaoCostas,
            imagemPersonalizacaoFrente: cor.imagemPersonalizacaoFrente,
            imagemPersonalizacaoCostas: cor.imagemPersonalizacaoCostas,
          });
          await tx.orm.public.ProdutoVariante.createAndCount(
            cor.estoque.map(({ tamanho, quantidade }) => ({ produtoCorId: criada.id, tamanho, estoque: quantidade })),
          );
        }

        return produto.id;
      })
      .catch(categoriaRemovida);
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
      db.orm.public.ProdutoCor.where({ produtoId: id })
        .where((c) => c.variantes.some((v) => v.itens.some()))
        .select('id')
        .all(),
    ]);

    if (!produto) {
      return null;
    }
    return { ...produto, categorias, coresVendidas: new Set(coresVendidas.map((cor) => cor.id)) };
  }
}

export type ProdutoDetalhado = NonNullable<Awaited<ReturnType<ProdutosRepository['detalhar']>>>;

function categoriaRemovida(error: unknown): never {
  if (violou(error, '23503', CATEGORIA_DO_PRODUTO)) {
    throw new DadosDoProdutoInvalidosError({ categorias: CATEGORIAS_INVALIDAS });
  }
  throw error;
}

function violou(error: unknown, sqlStateEsperado: string, constraintEsperada: string) {
  if (!(error instanceof Error)) {
    return false;
  }
  const { sqlState, constraint } = error as Error & { sqlState?: string; constraint?: string };
  return sqlState === sqlStateEsperado && constraint === constraintEsperada;
}
