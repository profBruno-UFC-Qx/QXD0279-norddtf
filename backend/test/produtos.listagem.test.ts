import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { gerarChaveDeImagem } from '../src/modules/imagens/chaveDeImagem.js';
import { ProdutosRepository } from '../src/modules/produtos/repositories/ProdutosRepository.js';
import { TAMANHOS, type Tamanho } from '../src/modules/produtos/schemas/produtoSchemas.js';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { entrarComo } from './entrarComo.js';
import { criarCategoria } from './produtosDeTeste.js';

const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };

const repository = new ProdutosRepository();

type Agente = Awaited<ReturnType<typeof entrarComo>>['agent'];

interface OpcoesDoProduto {
  categorias: string[];
  nome?: string;
  preco?: string;
  descricao?: string | null;
  estoque?: Partial<Record<Tamanho, number>> | number;
  cores?: number;
}

interface ItemDaListagem {
  id: string;
  nome: string;
  preco: string;
  ativo: boolean;
  tipo: string;
  imagem: string | null;
}

function estoqueDaCor(estoque: OpcoesDoProduto['estoque']) {
  if (typeof estoque === 'number') {
    return [{ tamanho: null, quantidade: estoque }];
  }
  return TAMANHOS.map((tamanho) => ({ tamanho, quantidade: estoque?.[tamanho] ?? 10 }));
}

async function criarProduto({ categorias, nome, preco = '45.00', descricao = null, estoque, cores = 1 }: OpcoesDoProduto) {
  return repository.criar({
    tipo: 'PERSONALIZAVEL',
    nome: nome ?? `Produto ${randomUUID()}`,
    preco,
    descricao,
    categorias,
    temTamanho: typeof estoque !== 'number',
    cores: Array.from({ length: cores }, (_, indice) => ({
      nome: `Cor ${indice}`,
      hex: '#000000',
      imagemApresentacao: gerarChaveDeImagem('png'),
      imagemApresentacaoCostas: null,
      imagemPersonalizacaoFrente: gerarChaveDeImagem('png'),
      imagemPersonalizacaoCostas: null,
      estoque: estoqueDaCor(estoque),
    })),
  });
}

async function listar(agent: Agente, query: Record<string, string>) {
  const resposta = await agent.get('/admin/produtos').query(query);
  expect(resposta.status).toBe(200);
  return resposta.body as { itens: ItemDaListagem[]; total: number; pagina: number; porPagina: number };
}

async function idsListados(agent: Agente, query: Record<string, string>) {
  const { itens } = await listar(agent, query);
  return itens.map((item) => item.id).sort();
}

describe('GET /admin/produtos', () => {
  describe('busca', () => {
    it('acha pelo nome sem diferenciar acento e maiúscula', async () => {
      const { agent } = await entrarComo('ADMIN');
      const lote = await criarCategoria();
      const camisa = await criarProduto({ categorias: [lote.id], nome: 'Camisa básica' });
      await criarProduto({ categorias: [lote.id], nome: 'Caneca' });

      expect(await idsListados(agent, { busca: 'camisa basica', categorias: lote.id })).toEqual([camisa]);
      expect(await idsListados(agent, { busca: 'CAMISA', categorias: lote.id })).toEqual([camisa]);
    });

    it('acha pela categoria uma vez só, mesmo com duas categorias que casam', async () => {
      const { agent } = await entrarComo('ADMIN');
      const lote = await criarCategoria(`Lote ${randomUUID()}`);
      const esporte = await criarCategoria(`Esporte ${randomUUID()}`);
      const radical = await criarCategoria(`Esporte radical ${randomUUID()}`);
      const regata = await criarProduto({ categorias: [lote.id, esporte.id, radical.id], nome: 'Regata' });
      await criarProduto({ categorias: [lote.id], nome: 'Caneca' });

      const resposta = await listar(agent, { busca: 'esporte', categorias: lote.id });

      expect(resposta.itens.map((item) => item.id)).toEqual([regata]);
      expect(resposta.total).toBe(1);
    });

    it('acha pela descrição', async () => {
      const { agent } = await entrarComo('ADMIN');
      const lote = await criarCategoria();
      const caneca = await criarProduto({ categorias: [lote.id], nome: 'Caneca', descricao: 'Ideal para o café da manhã' });
      await criarProduto({ categorias: [lote.id], nome: 'Copo', descricao: 'Para água' });

      expect(await idsListados(agent, { busca: 'cafe', categorias: lote.id })).toEqual([caneca]);
    });

    it('trata % e _ como texto', async () => {
      const { agent } = await entrarComo('ADMIN');
      const lote = await criarCategoria();
      const algodao = await criarProduto({ categorias: [lote.id], nome: '100% algodão_premium' });
      await criarProduto({ categorias: [lote.id], nome: 'Camisa básica' });

      expect(await idsListados(agent, { busca: 'a%a', categorias: lote.id })).toEqual([]);
      expect(await idsListados(agent, { busca: 'o_p', categorias: lote.id })).toEqual([algodao]);
      expect(await idsListados(agent, { busca: '100%', categorias: lote.id })).toEqual([algodao]);
    });

    it('ignora a busca vazia', async () => {
      const { agent } = await entrarComo('ADMIN');
      const lote = await criarCategoria();
      const produto = await criarProduto({ categorias: [lote.id] });

      expect(await idsListados(agent, { busca: '   ', categorias: lote.id })).toEqual([produto]);
    });

    it('ignora filtros vazios', async () => {
      const { agent } = await entrarComo('ADMIN');
      const lote = await criarCategoria();
      const produto = await criarProduto({ categorias: [lote.id] });

      const busca = encodeURIComponent(lote.nome);
      const resposta = await agent.get('/admin/produtos').query(`busca=${busca}&categorias=&precoMin=&precoMax=&tamanhos=`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.itens.map((item: ItemDaListagem) => item.id)).toEqual([produto]);
    });
  });

  describe('filtros', () => {
    async function catalogo() {
      const herois = await criarCategoria(`Heróis ${randomUUID()}`);
      const pokemon = await criarCategoria(`Pokemon ${randomUUID()}`);
      const outra = await criarCategoria();
      return {
        herois: herois.id,
        pokemon: pokemon.id,
        comG: await criarProduto({ categorias: [herois.id], preco: '30.00', estoque: { G: 5 } }),
        semG: await criarProduto({ categorias: [pokemon.id], preco: '40.00', estoque: { G: 0 } }),
        semTamanho: await criarProduto({ categorias: [pokemon.id], preco: '50.00', estoque: 8 }),
        foraDasCategorias: await criarProduto({ categorias: [outra.id], estoque: { G: 5 } }),
      };
    }

    it('categorias somam com OU', async () => {
      const { agent } = await entrarComo('ADMIN');
      const { herois, pokemon, comG, semG, semTamanho } = await catalogo();

      expect(await idsListados(agent, { categorias: `${herois},${pokemon}` })).toEqual([comG, semG, semTamanho].sort());
    });

    it('tamanho traz só quem tem estoque maior que zero nele', async () => {
      const { agent } = await entrarComo('ADMIN');
      const { herois, pokemon, comG } = await catalogo();

      expect(await idsListados(agent, { categorias: `${herois},${pokemon}`, tamanhos: 'G' })).toEqual([comG]);
    });

    it('tamanhos somam com OU e produto sem tamanho fica fora', async () => {
      const { agent } = await entrarComo('ADMIN');
      const { herois, pokemon, comG, semG } = await catalogo();

      expect(await idsListados(agent, { categorias: `${herois},${pokemon}`, tamanhos: TAMANHOS.join(',') })).toEqual(
        [comG, semG].sort(),
      );
      expect(await idsListados(agent, { categorias: `${herois},${pokemon}`, tamanhos: 'G,P' })).toEqual([comG, semG].sort());
    });

    it('aceita a chave repetida como lista', async () => {
      const { agent } = await entrarComo('ADMIN');
      const { herois, pokemon, comG, semG } = await catalogo();

      const resposta = await agent
        .get('/admin/produtos')
        .query(`categorias=${herois}&categorias=${pokemon}&tamanhos=G&tamanhos=M`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.itens.map((item: ItemDaListagem) => item.id).sort()).toEqual([comG, semG].sort());
    });

    it('preço inclui os limites', async () => {
      const { agent } = await entrarComo('ADMIN');
      const { herois, pokemon, comG, semG, semTamanho } = await catalogo();
      const categorias = `${herois},${pokemon}`;

      expect(await idsListados(agent, { categorias, precoMin: '30', precoMax: '40.00' })).toEqual([comG, semG].sort());
      expect(await idsListados(agent, { categorias, precoMin: '40' })).toEqual([semG, semTamanho].sort());
      expect(await idsListados(agent, { categorias, precoMax: '30.0' })).toEqual([comG]);
    });

    it('combina busca e filtros com E', async () => {
      const { agent } = await entrarComo('ADMIN');
      const { herois, pokemon, semG } = await catalogo();

      const query = { busca: 'pokemon', categorias: `${herois},${pokemon}`, tamanhos: 'M', precoMax: '45' };
      expect(await idsListados(agent, query)).toEqual([semG]);
    });
  });

  it('pagina de 12 em 12, do mais recente para o mais antigo', async () => {
    const { agent } = await entrarComo('ADMIN');
    const lote = await criarCategoria();
    const ids: string[] = [];
    for (let indice = 0; indice < 13; indice++) {
      ids.push(await criarProduto({ categorias: [lote.id], cores: 2 }));
    }
    const recentes = [...ids].reverse();

    const primeira = await listar(agent, { categorias: lote.id });
    const segunda = await listar(agent, { categorias: lote.id, pagina: '2' });
    const alemDaUltima = await listar(agent, { categorias: lote.id, pagina: '3' });

    expect(primeira.itens.map((item) => item.id)).toEqual(recentes.slice(0, 12));
    expect(primeira).toMatchObject({ total: 13, pagina: 1, porPagina: 12 });
    expect(primeira.itens.every((item) => item.imagem !== null)).toBe(true);
    expect(segunda.itens.map((item) => item.id)).toEqual([ids[0]]);
    expect(segunda).toMatchObject({ total: 13, pagina: 2, porPagina: 12 });
    expect(alemDaUltima.itens).toEqual([]);
    expect(alemDaUltima.total).toBe(13);
  });

  it('responde o item com a imagem da cor de menor posição', async () => {
    const { agent } = await entrarComo('ADMIN');
    const lote = await criarCategoria();
    const nome = `Camisa ${randomUUID()}`;
    const id = await criarProduto({ categorias: [lote.id], nome, cores: 2 });
    const [primeira, segunda] = await db.orm.public.ProdutoCor.where({ produtoId: id })
      .select('id', 'imagemApresentacao')
      .orderBy((c) => c.posicao.asc())
      .all();

    const { itens } = await listar(agent, { categorias: lote.id });
    expect(itens).toEqual([
      {
        id,
        nome,
        preco: '45.00',
        ativo: true,
        tipo: 'PERSONALIZAVEL',
        imagem: `/imagens/${primeira!.imagemApresentacao}`,
      },
    ]);

    await db.orm.public.ProdutoCor.where({ id: primeira!.id }).updateAndCount({ posicao: 2 });
    const depois = await listar(agent, { categorias: lote.id });
    expect(depois.itens[0]!.imagem).toBe(`/imagens/${segunda!.imagemApresentacao}`);
  });

  it('lista o inativo com ativo falso', async () => {
    const { agent } = await entrarComo('ADMIN');
    const lote = await criarCategoria();
    const id = await criarProduto({ categorias: [lote.id] });
    await repository.mudarSituacao(id, false);

    const { itens } = await listar(agent, { categorias: lote.id });
    expect(itens).toEqual([expect.objectContaining({ id, ativo: false })]);
  });

  it('traz a faixa de preço de todos os produtos, sem os filtros', async () => {
    const { agent } = await entrarComo('ADMIN');
    const lote = await criarCategoria();
    await criarProduto({ categorias: [lote.id], preco: '0.01' });
    await criarProduto({ categorias: [lote.id], preco: '99999.99' });
    const outra = await criarCategoria();
    await criarProduto({ categorias: [outra.id], preco: '45.00' });

    const resposta = await agent.get('/admin/produtos').query({ categorias: outra.id });

    expect(resposta.status).toBe(200);
    expect(resposta.body.faixaDePreco).toEqual({ min: '0.01', max: '99999.99' });
  });

  it.each([
    ['pagina', { pagina: '0' }],
    ['pagina', { pagina: 'abc' }],
    ['pagina', { pagina: '1.5' }],
    ['tamanhos', { tamanhos: 'XG' }],
    ['tamanhos', { tamanhos: 'G,' }],
    ['categorias', { categorias: 'abc' }],
    ['precoMin', { precoMin: '-1' }],
    ['precoMax', { precoMax: '10.999' }],
    ['busca', { busca: 'a'.repeat(121) }],
    ['busca', 'busca=a&busca=b'],
    ['precoMax', { precoMin: '50', precoMax: 'abc' }],
  ])('responde 400 em %s com %o', async (campo, query) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.get('/admin/produtos').query(query);

    expect(resposta.status).toBe(400);
    expect(resposta.body.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(resposta.body.errors)).toEqual([campo]);
  });

  it('responde 400 com preço mínimo maior que o máximo', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.get('/admin/produtos').query({ precoMin: '50', precoMax: '49.99' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      code: 'VALIDATION_ERROR',
      errors: { precoMin: 'O preço mínimo não pode ser maior que o máximo.' },
    });
  });

  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).get('/admin/produtos');

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await agent.get('/admin/produtos');

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });

  describe('sem produto cadastrado', () => {
    it('responde a lista vazia e a faixa de preço nula', async () => {
      const { agent } = await entrarComo('ADMIN');
      await db.orm.public.Item.where((i) => i.produtoVarianteId.isNotNull()).deleteAll();
      await db.orm.public.ProdutoVariante.where((v) => v.id.isNotNull()).deleteAll();
      await db.orm.public.ProdutoCor.where((c) => c.id.isNotNull()).deleteAll();
      await db.orm.public.ProdutoCategoria.where((pc) => pc.produtoId.isNotNull()).deleteAll();
      await db.orm.public.Produto.where((p) => p.id.isNotNull()).deleteAll();
      const { total } = await db.orm.public.Produto.aggregate((a) => ({ total: a.count() }));
      expect(total).toBe(0);

      const resposta = await agent.get('/admin/produtos');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ itens: [], total: 0, pagina: 1, porPagina: 12, faixaDePreco: null });
    });
  });
});
