import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it, onTestFinished } from 'vitest';
import { gerarChaveDeImagem } from '../src/modules/imagens/chaveDeImagem.js';
import { ProdutosRepository } from '../src/modules/produtos/repositories/ProdutosRepository.js';
import { TAMANHOS, type Tamanho } from '../src/modules/produtos/schemas/produtoSchemas.js';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { entrarComo } from './entrarComo.js';
import { criarCategoria } from './produtosDeTeste.js';

const repository = new ProdutosRepository();

type EstoqueDaCor = Partial<Record<Tamanho, number>> | number;

interface OpcoesDoProduto {
  categorias: string[];
  nome?: string;
  preco?: string;
  descricao?: string | null;
  cores?: EstoqueDaCor[];
}

interface ItemDaLoja {
  id: string;
  nome: string;
  preco: string;
  tipo: string;
  imagem: string;
  cores: { nome: string; hex: string }[];
  totalDeCores: number;
}

interface Listagem {
  itens: ItemDaLoja[];
  total: number;
  pagina: number;
  porPagina: number;
  faixaDePreco: { min: string; max: string } | null;
}

function estoqueDaCor(estoque: EstoqueDaCor) {
  if (typeof estoque === 'number') {
    return [{ tamanho: null, quantidade: estoque }];
  }
  return TAMANHOS.map((tamanho) => ({ tamanho, quantidade: estoque[tamanho] ?? 10 }));
}

async function criarProduto({ categorias, nome, preco = '45.00', descricao = null, cores = [{}] }: OpcoesDoProduto) {
  return repository.criar({
    tipo: 'PERSONALIZAVEL',
    nome: nome ?? `Produto ${randomUUID()}`,
    preco,
    descricao,
    categorias,
    temTamanho: typeof cores[0] !== 'number',
    cores: cores.map((estoque, indice) => ({
      nome: `Cor ${indice}`,
      hex: `#00000${indice}`,
      imagemApresentacao: gerarChaveDeImagem('png'),
      imagemApresentacaoCostas: null,
      imagemPersonalizacaoFrente: gerarChaveDeImagem('png'),
      imagemPersonalizacaoCostas: null,
      estoque: estoqueDaCor(estoque),
    })),
  });
}

function semEstoque(): EstoqueDaCor {
  return Object.fromEntries(TAMANHOS.map((tamanho) => [tamanho, 0]));
}

async function coresDoProduto(produtoId: string) {
  return db.orm.public.ProdutoCor.where({ produtoId })
    .select('nome', 'hex', 'imagemApresentacao')
    .orderBy((c) => c.posicao.asc())
    .all();
}

async function listar(query: Record<string, string>) {
  const resposta = await request(app).get('/produtos').query(query);
  expect(resposta.status).toBe(200);
  return resposta.body as Listagem;
}

async function idsListados(query: Record<string, string>) {
  const { itens } = await listar(query);
  return itens.map((item) => item.id).sort();
}

describe('GET /produtos', () => {
  it('não traz produto inativo', async () => {
    const lote = await criarCategoria();
    const ativo = await criarProduto({ categorias: [lote.id] });
    const inativo = await criarProduto({ categorias: [lote.id] });
    await repository.mudarSituacao(inativo, false);

    expect(await idsListados({ categorias: lote.id })).toEqual([ativo]);
  });

  it('não traz produto com todas as variantes zeradas', async () => {
    const lote = await criarCategoria();
    const comEstoque = await criarProduto({ categorias: [lote.id] });
    await criarProduto({ categorias: [lote.id], cores: [semEstoque(), semEstoque()] });
    await criarProduto({ categorias: [lote.id], cores: [0] });

    expect(await idsListados({ categorias: lote.id })).toEqual([comEstoque]);
  });

  it('responde só os campos da loja, com a imagem e as cores das cores com estoque', async () => {
    const lote = await criarCategoria();
    const nome = `Camisa ${randomUUID()}`;
    const id = await criarProduto({ categorias: [lote.id], nome, cores: [semEstoque(), { G: 1, P: 0 }] });
    const [, comEstoque] = await coresDoProduto(id);

    const resposta = await listar({ categorias: lote.id });

    expect(resposta.itens).toEqual([
      {
        id,
        nome,
        preco: '45.00',
        tipo: 'PERSONALIZAVEL',
        imagem: `/imagens/${comEstoque!.imagemApresentacao}`,
        cores: [{ nome: comEstoque!.nome, hex: comEstoque!.hex }],
        totalDeCores: 1,
      },
    ]);
  });

  it('traz três cores e conta todas as cores com estoque', async () => {
    const lote = await criarCategoria();
    const id = await criarProduto({ categorias: [lote.id], cores: [{}, semEstoque(), {}, {}, {}, {}] });
    const cores = await coresDoProduto(id);
    const comEstoque = cores.filter((_, indice) => indice !== 1);

    const { itens } = await listar({ categorias: lote.id });

    expect(itens[0]!.cores).toEqual(comEstoque.slice(0, 3).map(({ nome, hex }) => ({ nome, hex })));
    expect(itens[0]!.totalDeCores).toBe(5);
    expect(itens[0]!.imagem).toBe(`/imagens/${cores[0]!.imagemApresentacao}`);
  });

  it('o filtro de tamanho não traz quem só tem aquele tamanho zerado nem produto sem tamanho', async () => {
    const lote = await criarCategoria();
    const comG = await criarProduto({ categorias: [lote.id], cores: [{ G: 0 }, { G: 3 }] });
    await criarProduto({ categorias: [lote.id], cores: [{ G: 0 }] });
    await criarProduto({ categorias: [lote.id], cores: [8] });

    expect(await idsListados({ categorias: lote.id, tamanhos: 'G' })).toEqual([comG]);
  });

  it('busca sem acento pelo nome e pela categoria', async () => {
    const lote = await criarCategoria();
    const esporte = await criarCategoria(`Esporte radical ${randomUUID()}`);
    const camisa = await criarProduto({ categorias: [lote.id], nome: 'Camisa básica' });
    const regata = await criarProduto({ categorias: [lote.id, esporte.id], nome: 'Regata' });
    await criarProduto({ categorias: [lote.id], nome: 'Caneca' });

    expect(await idsListados({ busca: 'CAMISA BASICA', categorias: lote.id })).toEqual([camisa]);
    expect(await idsListados({ busca: 'esporte radical', categorias: lote.id })).toEqual([regata]);
  });

  it('pagina de 12 em 12, do mais recente para o mais antigo, sem contar o que não aparece', async () => {
    const lote = await criarCategoria();
    const ids: string[] = [];
    for (let indice = 0; indice < 13; indice++) {
      ids.push(await criarProduto({ categorias: [lote.id] }));
    }
    await criarProduto({ categorias: [lote.id], cores: [semEstoque()] });
    const recentes = [...ids].reverse();

    const primeira = await listar({ categorias: lote.id });
    const segunda = await listar({ categorias: lote.id, pagina: '2' });

    expect(primeira.itens.map((item) => item.id)).toEqual(recentes.slice(0, 12));
    expect(primeira).toMatchObject({ total: 13, pagina: 1, porPagina: 12 });
    expect(segunda.itens.map((item) => item.id)).toEqual([ids[0]]);
    expect(segunda).toMatchObject({ total: 13, pagina: 2, porPagina: 12 });
  });

  it('a faixa de preço não considera produto inativo nem sem estoque', async () => {
    const lote = await criarCategoria();
    await criarProduto({ categorias: [lote.id], preco: '45.00' });
    const inativo = await criarProduto({ categorias: [lote.id], preco: '0.00' });
    await repository.mudarSituacao(inativo, false);
    const zerado = await criarProduto({ categorias: [lote.id], preco: '99999999.99', cores: [semEstoque()] });
    onTestFinished(async () => {
      await repository.remover(inativo);
      await repository.remover(zerado);
    });
    const [esperada] = await db.runtime().query(
      db.raw.sql`
        SELECT min(p."preco")::text AS min, max(p."preco")::text AS max
        FROM "produto" p
        WHERE p."ativo" AND EXISTS (
          SELECT 1 FROM "produtoCor" c JOIN "produtoVariante" v ON v."produtoCorId" = c."id"
          WHERE c."produtoId" = p."id" AND v."estoque" > 0
        )`
        .returnsRow({ min: 'pg/text@1', max: 'pg/text@1' })
        .build(),
    );

    const { faixaDePreco } = await listar({ categorias: lote.id });

    expect(faixaDePreco).toEqual(esperada);
    expect(faixaDePreco!.min).not.toBe('0.00');
    expect(faixaDePreco!.max).not.toBe('99999999.99');
  });

  it('a listagem do admin continua trazendo o inativo e o sem estoque', async () => {
    const { agent } = await entrarComo('ADMIN');
    const lote = await criarCategoria();
    const inativo = await criarProduto({ categorias: [lote.id] });
    await repository.mudarSituacao(inativo, false);
    const zerado = await criarProduto({ categorias: [lote.id], cores: [semEstoque()] });

    const resposta = await agent.get('/admin/produtos').query({ categorias: lote.id });

    expect(resposta.status).toBe(200);
    expect(resposta.body.itens.map((item: { id: string }) => item.id).sort()).toEqual([inativo, zerado].sort());
    expect(await idsListados({ categorias: lote.id })).toEqual([]);
  });

  it('responde 400 com filtro inválido', async () => {
    const resposta = await request(app).get('/produtos').query({ pagina: '0' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(resposta.body.errors)).toEqual(['pagina']);
  });

  describe('sem produto visível', () => {
    it('responde a lista vazia e a faixa de preço nula', async () => {
      const lote = await criarCategoria();
      const ativos = await db.orm.public.Produto.where({ ativo: true }).select('id').all();
      onTestFinished(async () => {
        await db.orm.public.Produto.where((p) => p.id.in(ativos.map(({ id }) => id))).updateAll({ ativo: true });
      });
      await db.orm.public.Produto.where({ ativo: true }).updateAll({ ativo: false });
      await criarProduto({ categorias: [lote.id], cores: [semEstoque()] });

      const resposta = await request(app).get('/produtos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ itens: [], total: 0, pagina: 1, porPagina: 12, faixaDePreco: null });
    });
  });
});
