import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { db } from '../../../shared/infra/prisma/db.js';
import type { Models } from '../../../shared/infra/prisma/schema.js';
import type { DadosDoMaterial, TipoMaterial } from '../schemas/materialSchemas.js';

type PrecoPorM2 = Scalars<Models.public_Material>['precoPorM2'];

const CAMPOS = ['tipo', 'precoPorM2', 'descricao', 'etiqueta', 'larguraFolhaCm'] as const;

export class MateriaisRepository {
  async listar() {
    return db.orm.public.Material.select(...CAMPOS)
      .orderBy((m) => m.tipo.asc())
      .all();
  }

  async buscarPorTipo(tipo: TipoMaterial) {
    return db.orm.public.Material.select(...CAMPOS).where({ tipo }).first();
  }

  async atualizar(tipo: TipoMaterial, dados: DadosDoMaterial) {
    return db.orm.public.Material.where({ tipo }).select(...CAMPOS).update(paraGravar(dados));
  }

  async criar(tipo: TipoMaterial, dados: DadosDoMaterial) {
    return db.orm.public.Material.select(...CAMPOS).create({ tipo, ...paraGravar(dados) });
  }
}

function paraGravar(dados: DadosDoMaterial) {
  return { ...dados, precoPorM2: dados.precoPorM2 as PrecoPorM2 };
}
