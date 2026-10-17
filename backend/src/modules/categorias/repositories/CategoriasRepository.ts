import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { db } from '../../../shared/infra/prisma/db.js';
import type { Models } from '../../../shared/infra/prisma/schema.js';
import { CategoriaEmUsoError } from '../errors/CategoriaEmUsoError.js';
import { CategoriaJaCadastradaError } from '../errors/CategoriaJaCadastradaError.js';

interface DadosDaCategoria {
  nome: string;
  nomeNormalizado: string;
}

type CategoriaRow = Scalars<Models.public_Categoria>;
type Orm = typeof db.orm;

const NOME_UNICO = 'categoria_nomeNormalizado_key';
const CHAVES_DE_USO = ['produtoCategoria_categoriaId_fkey', 'estampaCategoria_categoriaId_fkey'];

export class CategoriasRepository {
  async listar() {
    return db.orm.public.Categoria.select('id', 'nome')
      .orderBy((c) => c.nomeNormalizado.asc())
      .all();
  }

  async listarComUso() {
    return db.orm.public.Categoria.select('id', 'nome')
      .include('produtos', (produtos) => produtos.count())
      .include('estampas', (estampas) => estampas.count())
      .orderBy((c) => c.nomeNormalizado.asc())
      .all();
  }

  async buscarPorId(id: string): Promise<CategoriaRow | null> {
    return db.orm.public.Categoria.first({ id });
  }

  async buscarPorNomeNormalizado(nomeNormalizado: string): Promise<CategoriaRow | null> {
    return db.orm.public.Categoria.where({ nomeNormalizado }).first();
  }

  async criar(dados: DadosDaCategoria) {
    return db.orm.public.Categoria.select('id', 'nome').create(dados).catch(nomeRepetido);
  }

  async renomear(id: string, dados: DadosDaCategoria) {
    return db.orm.public.Categoria.where({ id }).select('id', 'nome').update(dados).catch(nomeRepetido);
  }

  async remover(id: string) {
    try {
      await db.transaction(async (tx) => {
        const { produtos, estampas } = await contarUso(tx.orm, id);
        if (produtos > 0 || estampas > 0) {
          throw new CategoriaEmUsoError(produtos, estampas);
        }
        await tx.orm.public.Categoria.where({ id }).delete();
      });
    } catch (error) {
      if (violou(error, '23503', CHAVES_DE_USO)) {
        const { produtos, estampas } = await contarUso(db.orm, id);
        throw new CategoriaEmUsoError(produtos, estampas);
      }
      throw error;
    }
  }
}

async function contarUso(orm: Orm, id: string) {
  const uso = await orm.public.Categoria.where({ id })
    .select('id')
    .include('produtos', (produtos) => produtos.count())
    .include('estampas', (estampas) => estampas.count())
    .first();
  return { produtos: uso?.produtos ?? 0, estampas: uso?.estampas ?? 0 };
}

function nomeRepetido(error: unknown): never {
  if (violou(error, '23505', [NOME_UNICO])) {
    throw new CategoriaJaCadastradaError();
  }
  throw error;
}

function violou(error: unknown, sqlStateEsperado: string, constraints: string[]) {
  if (!(error instanceof Error)) {
    return false;
  }
  const { sqlState, constraint } = error as Error & { sqlState?: string; constraint?: string };
  return sqlState === sqlStateEsperado && constraint !== undefined && constraints.includes(constraint);
}
