import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { entrarComo } from './entrarComo.js';
import { corpoDeProduto, estoque, gravarImagem, venderCor, venderCorDuranteARequisicao } from './produtosDeTeste.js';

const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };
const NAO_ENCONTRADO = { code: 'PRODUTO_NAO_ENCONTRADO', message: 'Produto não encontrado.' };
const COR_VENDIDA = {
  code: 'COR_VENDIDA',
  message: 'Esta cor já foi vendida e não pode ser removida.',
  cor: 'Preto',
};
const OPCAO_BLOQUEADA = {
  code: 'OPCAO_DE_TAMANHO_BLOQUEADA',
  message: 'Este produto já foi vendido e não pode mudar a opção de tamanho.',
};
const PRODUTO_VENDIDO = {
  code: 'PRODUTO_VENDIDO',
  message: 'Este produto já foi vendido e não pode ser removido. Inative-o para tirá-lo da loja.',
};

type Agente = Awaited<ReturnType<typeof entrarComo>>['agent'];
type Opcoes = Parameters<typeof corpoDeProduto>[0];

interface EntradaDeEstoque {
  tamanho: string | null;
  quantidade: number;
}

interface CorDoDetalhe {
  id: string;
  nome: string;
  hex: string;
  vendida: boolean;
  imagemApresentacao: { chave: string } | null;
  imagemApresentacaoCostas: { chave: string } | null;
  imagemPersonalizacaoFrente: { chave: string } | null;
  imagemPersonalizacaoCostas: { chave: string } | null;
  estoque: EntradaDeEstoque[];
}

interface Detalhe {
  id: string;
  nome: string;
  preco: string;
  descricao: string | null;
  temTamanho: boolean;
  categorias: { id: string }[];
  cores: CorDoDetalhe[];
}

function corDoCorpo({ vendida: _vendida, ...cor }: CorDoDetalhe) {
  return {
    ...cor,
    imagemApresentacao: cor.imagemApresentacao?.chave ?? null,
    imagemApresentacaoCostas: cor.imagemApresentacaoCostas?.chave ?? null,
    imagemPersonalizacaoFrente: cor.imagemPersonalizacaoFrente?.chave ?? null,
    imagemPersonalizacaoCostas: cor.imagemPersonalizacaoCostas?.chave ?? null,
  };
}

function corpoDaEdicao(produto: Detalhe) {
  return {
    nome: produto.nome,
    preco: produto.preco,
    descricao: produto.descricao,
    categorias: produto.categorias.map((categoria) => categoria.id),
    temTamanho: produto.temTamanho,
    cores: produto.cores.map(corDoCorpo),
  };
}

async function cadastrar(agent: Agente, opcoes?: Opcoes): Promise<Detalhe> {
  const resposta = await agent.post('/admin/produtos').send(await corpoDeProduto(opcoes));
  expect(resposta.status).toBe(201);
  return resposta.body;
}

async function editar(agent: Agente, id: string, corpo: unknown) {
  return agent.put(`/admin/produtos/${id}`).send(corpo as object);
}

async function variantesDaCor(corId: string) {
  return db.orm.public.ProdutoVariante.where({ produtoCorId: corId })
    .select('id', 'tamanho', 'estoque')
    .orderBy((v) => v.id.asc())
    .all();
}

async function corNova(nome: string) {
  return {
    nome,
    hex: '#FFFFFF',
    imagemApresentacao: await gravarImagem(),
    imagemApresentacaoCostas: null,
    imagemPersonalizacaoFrente: await gravarImagem(),
    imagemPersonalizacaoCostas: null,
    estoque: estoque(true, 3),
  };
}

describe('PUT /admin/produtos/:id', () => {
  it('muda preço e estoque mantendo as mesmas variantes', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const corpo = corpoDaEdicao(produto);
    const corId = produto.cores[0]!.id;
    const antes = await variantesDaCor(corId);

    const resposta = await editar(agent, produto.id, {
      ...corpo,
      preco: '59.90',
      cores: [{ ...corpo.cores[0]!, estoque: estoque(true, 4) }],
    });

    expect(resposta.status).toBe(200);
    const detalhe = await agent.get(`/admin/produtos/${produto.id}`);
    expect(detalhe.body.preco).toBe('59.90');
    expect(detalhe.body.cores[0].estoque).toEqual(estoque(true, 4));
    expect(resposta.body).toEqual(detalhe.body);
    const depois = await variantesDaCor(corId);
    expect(depois.map((v) => v.id)).toEqual(antes.map((v) => v.id));
    expect(depois.every((v) => v.estoque === 4)).toBe(true);
  });

  it('atualiza o estoque de produto sem tamanho no lugar', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { temTamanho: false });
    const corpo = corpoDaEdicao(produto);
    const [antes] = await variantesDaCor(produto.cores[0]!.id);

    const resposta = await editar(agent, produto.id, {
      ...corpo,
      cores: [{ ...corpo.cores[0]!, estoque: estoque(false, 7) }],
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.cores[0].estoque).toEqual([{ tamanho: null, quantidade: 7 }]);
    expect(await variantesDaCor(produto.cores[0]!.id)).toEqual([{ ...antes, estoque: 7 }]);
  });

  it('muda nome, descrição e categorias e refaz a busca normalizada', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const outro = await corpoDeProduto();
    const nome = `Regata ${randomUUID()}`;

    const resposta = await editar(agent, produto.id, {
      ...corpoDaEdicao(produto),
      nome,
      descricao: 'Poliéster',
      categorias: outro.categorias,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe(nome);
    expect(resposta.body.categorias.map((c: { id: string }) => c.id)).toEqual(outro.categorias);
    const gravado = await db.orm.public.Produto.first({ id: produto.id });
    expect(gravado?.buscaNormalizada).toBe(`${nome.toLowerCase()} poliester`);
  });

  it('renomeia uma cor e troca o nome de duas cores entre si', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { cores: ['Preto', 'Branco', 'Azul'] });
    const [preto, branco, azul] = corpoDaEdicao(produto).cores;

    const resposta = await editar(agent, produto.id, {
      ...corpoDaEdicao(produto),
      cores: [
        { ...preto!, nome: 'Branco' },
        { ...branco!, nome: 'Preto' },
        { ...azul!, nome: 'Azul Céu' },
      ],
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.cores.map((cor: CorDoDetalhe) => [cor.id, cor.nome])).toEqual([
      [preto!.id, 'Branco'],
      [branco!.id, 'Preto'],
      [azul!.id, 'Azul Céu'],
    ]);
    const nomes = await db.orm.public.ProdutoCor.where({ id: azul!.id }).select('nomeNormalizado').first();
    expect(nomes?.nomeNormalizado).toBe('azul ceu');
  });

  it('põe a cor nova depois das existentes', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, { ...corpo, cores: [await corNova('Verde'), ...corpo.cores] });

    expect(resposta.status).toBe(200);
    expect(resposta.body.cores.map((cor: CorDoDetalhe) => cor.nome)).toEqual(['Preto', 'Branco', 'Verde']);
    expect(resposta.body.cores[2].estoque).toEqual(estoque(true, 3));
    const posicoes = await db.orm.public.ProdutoCor.where({ produtoId: produto.id })
      .select('posicao')
      .orderBy((c) => c.posicao.asc())
      .all();
    expect(posicoes.map((cor) => cor.posicao)).toEqual([0, 1, 2]);
  });

  it('trata a cor com id nulo como cor nova', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, { ...corpo, cores: [...corpo.cores, { ...(await corNova('Verde')), id: null }] });

    expect(resposta.status).toBe(200);
    expect(resposta.body.cores.map((cor: CorDoDetalhe) => cor.nome)).toEqual(['Preto', 'Verde']);
  });

  it('aceita cor nova com o nome que uma cor existente deixou', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const [preto] = corpoDaEdicao(produto).cores;

    const resposta = await editar(agent, produto.id, {
      ...corpoDaEdicao(produto),
      cores: [{ ...preto!, nome: 'Grafite' }, await corNova('Preto')],
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.cores.map((cor: CorDoDetalhe) => cor.nome)).toEqual(['Grafite', 'Preto']);
  });

  it('remove a cor que não veio, junto com o estoque dela', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
    const [preto, branco] = corpoDaEdicao(produto).cores;

    const resposta = await editar(agent, produto.id, { ...corpoDaEdicao(produto), cores: [branco] });

    expect(resposta.status).toBe(200);
    expect(resposta.body.cores.map((cor: CorDoDetalhe) => cor.id)).toEqual([branco!.id]);
    expect(await db.orm.public.ProdutoCor.first({ id: preto!.id })).toBeNull();
    expect(await variantesDaCor(preto!.id)).toEqual([]);
  });

  it('troca a opção de tamanho de produto não vendido por uma entrada nula por cor', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, {
      ...corpo,
      temTamanho: false,
      cores: corpo.cores.map((cor) => ({ ...cor, estoque: estoque(false, 5) })),
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.temTamanho).toBe(false);
    expect(resposta.body.cores.map((cor: CorDoDetalhe) => cor.estoque)).toEqual([
      [{ tamanho: null, quantidade: 5 }],
      [{ tamanho: null, quantidade: 5 }],
    ]);
  });

  describe('com o produto vendido', () => {
    async function cadastrarVendido(agent: Agente) {
      const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
      await venderCor(produto.cores[0]!.id);
      return produto;
    }

    it('recusa remover a cor vendida e não muda nada', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrarVendido(agent);
      const [, branco] = corpoDaEdicao(produto).cores;
      const antes = await agent.get(`/admin/produtos/${produto.id}`);

      const resposta = await editar(agent, produto.id, { ...corpoDaEdicao(produto), preco: '99.00', cores: [branco] });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual(COR_VENDIDA);
      const depois = await agent.get(`/admin/produtos/${produto.id}`);
      expect(depois.body).toEqual(antes.body);
    });

    it('recusa mudar a opção de tamanho', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrarVendido(agent);
      const corpo = corpoDaEdicao(produto);

      const resposta = await editar(agent, produto.id, {
        ...corpo,
        temTamanho: false,
        cores: corpo.cores.map((cor) => ({ ...cor, estoque: estoque(false) })),
      });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual(OPCAO_BLOQUEADA);
    });

    it('marca o produto e a cor como vendidos no detalhe', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrarVendido(agent);

      const resposta = await agent.get(`/admin/produtos/${produto.id}`);

      expect(resposta.body.vendido).toBe(true);
      expect(resposta.body.cores.map((cor: CorDoDetalhe) => cor.vendida)).toEqual([true, false]);
    });

    it('edita o estoque da cor vendida sem perder a variante do pedido', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrarVendido(agent);
      const corpo = corpoDaEdicao(produto);
      const corId = produto.cores[0]!.id;
      const antes = await variantesDaCor(corId);

      const resposta = await editar(agent, produto.id, {
        ...corpo,
        cores: [{ ...corpo.cores[0]!, nome: 'Preto Fosco', estoque: estoque(true, 1) }, corpo.cores[1]],
      });

      expect(resposta.status).toBe(200);
      expect(resposta.body.cores[0].vendida).toBe(true);
      expect((await variantesDaCor(corId)).map((v) => v.id)).toEqual(antes.map((v) => v.id));
    });

    it('recusa remover a cor vendida numa venda que chega durante a gravação', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
      const [, branco] = corpoDaEdicao(produto).cores;

      const resposta = await venderCorDuranteARequisicao(produto.cores[0]!.id, () =>
        editar(agent, produto.id, { ...corpoDaEdicao(produto), cores: [branco] }),
      );

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual(COR_VENDIDA);
      expect(await db.orm.public.ProdutoCor.first({ id: produto.cores[0]!.id })).not.toBeNull();
    });

    it('recusa mudar a opção de tamanho numa venda que chega durante a gravação', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
      const corpo = corpoDaEdicao(produto);

      const resposta = await venderCorDuranteARequisicao(produto.cores[1]!.id, () =>
        editar(agent, produto.id, {
          ...corpo,
          temTamanho: false,
          cores: corpo.cores.map((cor) => ({ ...cor, estoque: estoque(false) })),
        }),
      );

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual(OPCAO_BLOQUEADA);
      const gravado = await db.orm.public.Produto.first({ id: produto.id });
      expect(gravado?.temTamanho).toBe(true);
    });
  });

  describe('com duas edições ao mesmo tempo', () => {
    it('grava uma depois da outra quando as duas mudam o estoque e uma muda a opção de tamanho', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrar(agent);
      const corpo = corpoDaEdicao(produto);
      const semTamanho = {
        ...corpo,
        temTamanho: false,
        cores: corpo.cores.map((cor) => ({ ...cor, estoque: estoque(false, 5) })),
      };
      const comTamanho = { ...corpo, preco: '50.00', cores: corpo.cores.map((cor) => ({ ...cor, estoque: estoque(true, 2) })) };

      const respostas = await Promise.all([editar(agent, produto.id, semTamanho), editar(agent, produto.id, comTamanho)]);

      expect(respostas.map((resposta) => resposta.status)).toEqual([200, 200]);
      const final = await agent.get(`/admin/produtos/${produto.id}`);
      expect(final.body.cores[0].estoque).toEqual(estoque(final.body.temTamanho, final.body.temTamanho ? 2 : 5));
    });

    it('aceita o mesmo envio duas vezes com uma cor nova', async () => {
      const { agent } = await entrarComo('ADMIN');
      const produto = await cadastrar(agent);
      const corpo = corpoDaEdicao(produto);
      const comVerde = { ...corpo, cores: [...corpo.cores, await corNova('Verde')] };

      const respostas = await Promise.all([editar(agent, produto.id, comVerde), editar(agent, produto.id, comVerde)]);

      expect(respostas.map((resposta) => resposta.status)).toEqual([200, 200]);
      const final = await agent.get(`/admin/produtos/${produto.id}`);
      expect(final.body.cores.map((cor: CorDoDetalhe) => cor.nome)).toEqual(['Preto', 'Verde']);
    });
  });

  it('ignora o tipo enviado no corpo', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);

    const resposta = await editar(agent, produto.id, { ...corpoDaEdicao(produto), tipo: 'VENDA_DIRETA' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.tipo).toBe('PERSONALIZAVEL');
  });

  it('valida as imagens pelo tipo gravado', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { tipo: 'VENDA_DIRETA' });
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, {
      ...corpo,
      tipo: 'PERSONALIZAVEL',
      cores: [{ ...corpo.cores[0]!, imagemPersonalizacaoFrente: await gravarImagem() }],
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors).toEqual({ 'cores.0.imagemPersonalizacaoFrente': 'Este tipo de produto não usa essa imagem.' });
  });

  it('recusa chave de imagem que não existe no bucket', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, {
      ...corpo,
      cores: [{ ...corpo.cores[0]!, imagemApresentacao: `produtos/${randomUUID()}.png` }],
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors).toEqual({ 'cores.0.imagemApresentacao': 'Envie a imagem de apresentação.' });
  });

  it.each([
    ['de outro produto', async (agent: Agente) => (await cadastrar(agent)).cores[0]!.id],
    ['inexistente', async () => randomUUID()],
    ['que não é UUID', async () => 'abc'],
  ])('recusa cor com id %s', async (_caso, idDaCor) => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, {
      ...corpo,
      cores: [{ ...corpo.cores[0]!, id: await idDaCor(agent) }],
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors).toEqual({ 'cores.0.id': 'Cor não encontrada.' });
  });

  it('recusa a mesma cor duas vezes', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const [preto] = corpoDaEdicao(produto).cores;

    const resposta = await editar(agent, produto.id, {
      ...corpoDaEdicao(produto),
      cores: [preto, { ...preto!, nome: 'Grafite' }],
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors).toEqual({ 'cores.1.id': 'Cor não encontrada.' });
  });

  it('recusa estoque que não bate com a opção de tamanho', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);
    const corpo = corpoDaEdicao(produto);

    const resposta = await editar(agent, produto.id, { ...corpo, temTamanho: false });

    expect(resposta.status).toBe(400);
    expect(resposta.body.errors).toEqual({ 'cores.0.estoque': 'Defina o estoque da cor Preto.' });
  });

  it.each([
    ['inexistente', randomUUID()],
    ['com id que não é UUID', 'abc'],
  ])('responde 404 para produto %s antes de validar o corpo', async (_caso, id) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await editar(agent, id, {});

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADO);
  });

  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).put(`/admin/produtos/${randomUUID()}`).send({});

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await editar(agent, randomUUID(), {});

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });
});

describe('PATCH /admin/produtos/:id/situacao', () => {
  it('inativa e ativa de novo', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);

    const inativo = await agent.patch(`/admin/produtos/${produto.id}/situacao`).send({ ativo: false });
    const detalhe = await agent.get(`/admin/produtos/${produto.id}`);
    const ativo = await agent.patch(`/admin/produtos/${produto.id}/situacao`).send({ ativo: true });

    expect(inativo.status).toBe(200);
    expect(inativo.body).toEqual({ id: produto.id, ativo: false });
    expect(detalhe.body.ativo).toBe(false);
    expect(ativo.status).toBe(200);
    expect(ativo.body).toEqual({ id: produto.id, ativo: true });
  });

  it.each([
    ['vazio', {}],
    ['com texto', { ativo: 'false' }],
  ])('recusa corpo %s', async (_caso, corpo) => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);

    const resposta = await agent.patch(`/admin/produtos/${produto.id}/situacao`).send(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ code: 'VALIDATION_ERROR', errors: { ativo: 'Informe a situação.' } });
  });

  it.each([
    ['inexistente', randomUUID()],
    ['com id que não é UUID', 'abc'],
  ])('responde 404 para produto %s', async (_caso, id) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.patch(`/admin/produtos/${id}/situacao`).send({ ativo: false });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADO);
  });

  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).patch(`/admin/produtos/${randomUUID()}/situacao`).send({ ativo: false });

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await agent.patch(`/admin/produtos/${randomUUID()}/situacao`).send({ ativo: false });

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });
});

describe('DELETE /admin/produtos/:id', () => {
  it('remove o produto sem venda com cores, estoque e categorias', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
    const categoria = produto.categorias[0]!;
    const usoAntes = await agent.get('/admin/categorias');

    const resposta = await agent.delete(`/admin/produtos/${produto.id}`);

    expect(resposta.status).toBe(204);
    expect((await agent.get(`/admin/produtos/${produto.id}`)).status).toBe(404);
    const usoDepois = await agent.get('/admin/categorias');
    expect(usoAntes.body).toContainEqual({ ...categoria, produtos: 1 });
    expect(usoDepois.body).toContainEqual({ ...categoria, produtos: 0 });
    expect(await db.orm.public.ProdutoCor.where({ produtoId: produto.id }).first()).toBeNull();
    for (const cor of produto.cores) {
      expect(await variantesDaCor(cor.id)).toEqual([]);
    }
  });

  it('recusa remover produto vendido', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent, { cores: ['Preto', 'Branco'] });
    await venderCor(produto.cores[1]!.id);

    const resposta = await agent.delete(`/admin/produtos/${produto.id}`);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual(PRODUTO_VENDIDO);
    expect((await agent.get(`/admin/produtos/${produto.id}`)).status).toBe(200);
  });

  it('recusa remover produto numa venda que chega durante a remoção', async () => {
    const { agent } = await entrarComo('ADMIN');
    const produto = await cadastrar(agent);

    const resposta = await venderCorDuranteARequisicao(produto.cores[0]!.id, () =>
      agent.delete(`/admin/produtos/${produto.id}`),
    );

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual(PRODUTO_VENDIDO);
    expect((await agent.get(`/admin/produtos/${produto.id}`)).status).toBe(200);
  });

  it.each([
    ['inexistente', randomUUID()],
    ['com id que não é UUID', 'abc'],
  ])('responde 404 para produto %s', async (_caso, id) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.delete(`/admin/produtos/${id}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADO);
  });

  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).delete(`/admin/produtos/${randomUUID()}`);

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await agent.delete(`/admin/produtos/${randomUUID()}`);

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });
});
