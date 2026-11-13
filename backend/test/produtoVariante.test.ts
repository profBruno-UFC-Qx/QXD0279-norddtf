import { randomUUID } from 'node:crypto';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import { describe, expect, it } from 'vitest';
import { normalizarNome } from '../src/modules/categorias/normalizarNome.js';
import { db } from '../src/shared/infra/prisma/db.js';
import type { Models } from '../src/shared/infra/prisma/schema.js';

type Preco = Scalars<Models.public_Produto>['preco'];

const VARIANTE_UNICA = 'produtoVariante_cor_tamanho_key_007a3aab';
const ITEM_DA_VARIANTE = 'item_produtoVarianteId_fkey';
const COR_UNICA = 'produtoCor_produtoId_nomeNormalizado_key';
const ESTOQUE_NAO_NEGATIVO = 'produtoVariante_estoque_nao_negativo_4a5c3906';

async function criarProduto() {
  const nome = `Camiseta ${randomUUID()}`;
  return db.orm.public.Produto.create({
    nome,
    preco: '49.90' as Preco,
    buscaNormalizada: normalizarNome(nome),
    tipo: 'PERSONALIZAVEL',
  });
}

function adicionarCor(produtoId: string, nome = 'Preta') {
  return db.orm.public.ProdutoCor.create({
    produtoId,
    posicao: 0,
    nome,
    nomeNormalizado: normalizarNome(nome),
    hex: '#000000',
    imagemApresentacao: `produtos/${randomUUID()}.png`,
  });
}

async function criarCor() {
  const produto = await criarProduto();
  return adicionarCor(produto.id);
}

async function falhaCom(operacao: Promise<unknown>, sqlState: string, constraint: string) {
  await expect(operacao).rejects.toMatchObject({ sqlState, constraint });
}

describe('ProdutoCor', () => {
  it('não aceita o mesmo nome de cor duas vezes no produto, sem diferenciar acento e maiúsculas', async () => {
    const produto = await criarProduto();
    await adicionarCor(produto.id, 'Préto');

    await falhaCom(adicionarCor(produto.id, 'preto'), '23505', COR_UNICA);
  });

  it('aceita o mesmo nome de cor em produtos diferentes', async () => {
    const produtoA = await criarProduto();
    const produtoB = await criarProduto();

    const corA = await adicionarCor(produtoA.id, 'Preto');
    const corB = await adicionarCor(produtoB.id, 'Preto');

    expect([corA.nomeNormalizado, corB.nomeNormalizado]).toEqual(['preto', 'preto']);
  });
});

describe('ProdutoVariante', () => {
  it('não aceita estoque negativo', async () => {
    const cor = await criarCor();

    await falhaCom(
      db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: 'P', estoque: -1 }),
      '23514',
      ESTOQUE_NAO_NEGATIVO,
    );
  });

  it('não aceita duas variantes sem tamanho na mesma cor', async () => {
    const cor = await criarCor();
    await db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: null });

    await falhaCom(
      db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: null }),
      '23505',
      VARIANTE_UNICA,
    );
  });

  it('não aceita o mesmo tamanho duas vezes na mesma cor', async () => {
    const cor = await criarCor();
    await db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: 'P' });

    await falhaCom(
      db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: 'P' }),
      '23505',
      VARIANTE_UNICA,
    );
  });

  it('aceita tamanhos diferentes na mesma cor', async () => {
    const cor = await criarCor();
    await db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: 'P' });
    await db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: 'M' });

    const variantes = await db.orm.public.ProdutoVariante.where({ produtoCorId: cor.id }).all();

    expect(variantes.map((v) => v.tamanho).sort()).toEqual(['M', 'P']);
  });

  it('aceita uma variante sem tamanho em cada cor', async () => {
    const corA = await criarCor();
    const corB = await criarCor();

    const varianteA = await db.orm.public.ProdutoVariante.create({ produtoCorId: corA.id, tamanho: null });
    const varianteB = await db.orm.public.ProdutoVariante.create({ produtoCorId: corB.id, tamanho: null });

    expect([varianteA.tamanho, varianteB.tamanho]).toEqual([null, null]);
  });

  it('não deixa apagar variante que já foi vendida', async () => {
    const cor = await criarCor();
    const variante = await db.orm.public.ProdutoVariante.create({ produtoCorId: cor.id, tamanho: 'G', estoque: 3 });
    const user = await db.orm.public.User.create({ nome: 'Ana', email: `cliente-${randomUUID()}@x.com` });
    const pedido = await db.orm.public.Pedido.create({ userId: user.id, valorTotal: '49.90' });
    await db.orm.public.Item.create({
      pedidoId: pedido.id,
      tipo: 'PRODUTO',
      produtoVarianteId: variante.id,
      quantidade: 1,
      precoUnitario: '49.90',
    });

    await falhaCom(
      db.orm.public.ProdutoVariante.where({ id: variante.id }).delete(),
      '23503',
      ITEM_DA_VARIANTE,
    );
  });
});
