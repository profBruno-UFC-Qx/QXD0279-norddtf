#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/62ac2154fe95f33d709e495e4187bdce491ef53b13817ffc1c299ad46711d8a0/contract';
import endContract from '../../snapshots/62ac2154fe95f33d709e495e4187bdce491ef53b13817ffc1c299ad46711d8a0/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'categoria',
        columns: [
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('descricao', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('nome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nomeNormalizado', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'endereco',
        columns: [
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('bairro', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cep', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cidade', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('complemento', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('estado', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('logradouro', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('numero', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'item',
        columns: [
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('comprimentoCm', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('materialId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('pedidoId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('precoUnitario', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('produtoVarianteId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantidade', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('tipo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('item_tipo_check_32a3de8a', "\"tipo\" IN ('PRODUTO', 'MATERIAL')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'itemEstampa',
        columns: [
          col('alturaCm', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('arteClienteUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('itemId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('larguraCm', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('posicao', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('quantidade', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'itemEstampa_posicao_check_f58d6a04',
            "\"posicao\" IN ('FRENTE', 'COSTAS')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'material',
        columns: [
          col('descricao', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('etiqueta', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('larguraFolhaCm', 'numeric', {
            notNull: true,
            default: lit('57'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('precoPorM2', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('tipo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('material_tipo_check_05923c9f', "\"tipo\" IN ('DTF', 'DTF_UV')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'pedido',
        columns: [
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('RECEBIDO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('valorTotal', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pedido_status_check_16a9c013',
            "\"status\" IN ('RECEBIDO', 'CONFIRMADO', 'IMPRESSAO', 'PRONTO', 'ENVIADO', 'ENTREGUE', 'CANCELADO')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'pedidoStatusHistorico',
        columns: [
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('pedidoId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pedidoStatusHistorico_status_check_16a9c013',
            "\"status\" IN ('RECEBIDO', 'CONFIRMADO', 'IMPRESSAO', 'PRONTO', 'ENVIADO', 'ENTREGUE', 'CANCELADO')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'produto',
        columns: [
          col('ativo', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('buscaNormalizada', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('descricao', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('nome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('preco', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('temTamanho', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('tipo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('produto_preco_nao_negativo_e54711fe', 'preco >= 0'),
          checkExpression(
            'produto_tipo_check_d3633827',
            "\"tipo\" IN ('PERSONALIZAVEL', 'VENDA_DIRETA')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'produtoCategoria',
        columns: [
          col('categoriaId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('produtoId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['produtoId', 'categoriaId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'produtoCor',
        columns: [
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('hex', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('imagemApresentacao', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('imagemApresentacaoCostas', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('imagemPersonalizacaoCostas', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('imagemPersonalizacaoFrente', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nomeNormalizado', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('posicao', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('produtoId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'produtoVariante',
        columns: [
          col('estoque', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('produtoCorId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('tamanho', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('produtoVariante_estoque_nao_negativo_4a5c3906', 'estoque >= 0'),
          checkExpression(
            'produtoVariante_tamanho_check_9d3bda29',
            "\"tamanho\" IN ('P', 'M', 'G', 'GG', 'G1', 'G2')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('atualizadoEm', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('cpf', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('criadoEm', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('enderecoId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('nome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('senha', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sub', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('telefone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tipoPerfil', 'text', {
            notNull: true,
            default: lit('USER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('user_tipoPerfil_check_9b96b182', "\"tipoPerfil\" IN ('ADMIN', 'USER')"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'categoria',
        constraint: 'categoria_nomeNormalizado_key',
        columns: ['nomeNormalizado'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'material',
        constraint: 'material_tipo_key',
        columns: ['tipo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'produtoCor',
        constraint: 'produtoCor_produtoId_nomeNormalizado_key',
        columns: ['produtoId', 'nomeNormalizado'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_sub_key',
        columns: ['sub'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_cpf_key',
        columns: ['cpf'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'endereco',
        index: 'endereco_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'item',
        index: 'item_materialId_idx_e0f85a6d',
        columns: ['materialId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'item',
        index: 'item_pedidoId_idx_4742647d',
        columns: ['pedidoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'item',
        index: 'item_produtoVarianteId_idx_0f4efd0f',
        columns: ['produtoVarianteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'itemEstampa',
        index: 'itemEstampa_itemId_idx_41357140',
        columns: ['itemId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pedido',
        index: 'pedido_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pedidoStatusHistorico',
        index: 'pedidoStatusHistorico_pedidoId_idx_4742647d',
        columns: ['pedidoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'produtoCategoria',
        index: 'produtoCategoria_categoriaId_idx_63b46427',
        columns: ['categoriaId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'produtoCategoria',
        index: 'produtoCategoria_produtoId_idx_eb62fdb9',
        columns: ['produtoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'produtoCor',
        index: 'produtoCor_produtoId_idx_eb62fdb9',
        columns: ['produtoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'produtoVariante',
        index: 'produtoVariante_cor_tamanho_key_007a3aab',
        expression: '"produtoCorId", coalesce(tamanho, \'\')',
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'produtoVariante',
        index: 'produtoVariante_produtoCorId_idx_b6d6476b',
        columns: ['produtoCorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user',
        index: 'user_enderecoId_idx_a967c346',
        columns: ['enderecoId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'endereco',
        foreignKey: {
          name: 'endereco_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'item',
        foreignKey: {
          name: 'item_pedidoId_fkey',
          columns: ['pedidoId'],
          references: { schema: 'public', table: 'pedido', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'item',
        foreignKey: {
          name: 'item_produtoVarianteId_fkey',
          columns: ['produtoVarianteId'],
          references: { schema: 'public', table: 'produtoVariante', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'item',
        foreignKey: {
          name: 'item_materialId_fkey',
          columns: ['materialId'],
          references: { schema: 'public', table: 'material', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'itemEstampa',
        foreignKey: {
          name: 'itemEstampa_itemId_fkey',
          columns: ['itemId'],
          references: { schema: 'public', table: 'item', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pedido',
        foreignKey: {
          name: 'pedido_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pedidoStatusHistorico',
        foreignKey: {
          name: 'pedidoStatusHistorico_pedidoId_fkey',
          columns: ['pedidoId'],
          references: { schema: 'public', table: 'pedido', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'produtoCategoria',
        foreignKey: {
          name: 'produtoCategoria_produtoId_fkey',
          columns: ['produtoId'],
          references: { schema: 'public', table: 'produto', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'produtoCategoria',
        foreignKey: {
          name: 'produtoCategoria_categoriaId_fkey',
          columns: ['categoriaId'],
          references: { schema: 'public', table: 'categoria', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'produtoCor',
        foreignKey: {
          name: 'produtoCor_produtoId_fkey',
          columns: ['produtoId'],
          references: { schema: 'public', table: 'produto', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'produtoVariante',
        foreignKey: {
          name: 'produtoVariante_produtoCorId_fkey',
          columns: ['produtoCorId'],
          references: { schema: 'public', table: 'produtoCor', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user',
        foreignKey: {
          name: 'user_enderecoId_fkey',
          columns: ['enderecoId'],
          references: { schema: 'public', table: 'endereco', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
