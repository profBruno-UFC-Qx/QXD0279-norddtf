import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProdutosRepository } from '../src/modules/produtos/repositories/ProdutosRepository.js';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { entrarComo } from './entrarComo.js';
import { corpoDeProduto, criarCategoria, estoque, gravarImagem } from './produtosDeTeste.js';

const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };
const NAO_ENCONTRADO = { code: 'PRODUTO_NAO_ENCONTRADO', message: 'Produto não encontrado.' };
const IMAGEM_PROIBIDA = 'Este tipo de produto não usa essa imagem.';

type Corpo = Awaited<ReturnType<typeof corpoDeProduto>>;
type Agente = Awaited<ReturnType<typeof entrarComo>>['agent'];

function imagem(chave: string | null) {
  return chave ? { chave, url: `/imagens/${chave}` } : null;
}

async function cadastrar(agent: Agente, corpo: unknown) {
  return agent.post('/admin/produtos').send(corpo as object);
}

async function cadastrarComErro(corpo: unknown) {
  const { agent } = await entrarComo('ADMIN');
  const resposta = await cadastrar(agent, corpo);
  expect(resposta.status).toBe(400);
  expect(resposta.body.code).toBe('VALIDATION_ERROR');
  return resposta.body.errors as Record<string, string>;
}

function semEstoque(corpo: Corpo) {
  const { estoque: _estoque, ...cor } = corpo.cores[0]!;
  return { ...corpo, cores: [cor] };
}

function comCor(corpo: Corpo, mudancas: Record<string, unknown>) {
  return { ...corpo, cores: [{ ...corpo.cores[0]!, ...mudancas }] };
}

async function venderCor(corId: string) {
  const variante = await db.orm.public.ProdutoVariante.where({ produtoCorId: corId }).first();
  const user = await db.orm.public.User.create({ nome: 'Ana', email: `cliente-${randomUUID()}@x.com` });
  const pedido = await db.orm.public.Pedido.create({ userId: user.id, valorTotal: '45.00' });
  await db.orm.public.Item.create({
    pedidoId: pedido.id,
    tipo: 'PRODUTO',
    produtoVarianteId: variante!.id,
    quantidade: 1,
    precoUnitario: '45.00',
  });
}

describe('POST /admin/produtos', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cadastra um personalizável com duas cores, imagens e estoque por tamanho, nascendo ativo', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto({ cores: ['Preto', 'Branco'] });

    const resposta = await cadastrar(agent, corpo);

    expect(resposta.status).toBe(201);
    const categoria = await db.orm.public.Categoria.select('id', 'nome').first({ id: corpo.categorias[0]! });
    expect(resposta.body).toEqual({
      id: expect.any(String),
      tipo: 'PERSONALIZAVEL',
      nome: corpo.nome,
      preco: '45.00',
      descricao: 'Algodão 100%',
      temTamanho: true,
      ativo: true,
      vendido: false,
      categorias: [categoria],
      cores: corpo.cores.map((cor) => ({
        id: expect.any(String),
        nome: cor.nome,
        hex: cor.hex,
        vendida: false,
        imagemApresentacao: imagem(cor.imagemApresentacao),
        imagemApresentacaoCostas: null,
        imagemPersonalizacaoFrente: imagem(cor.imagemPersonalizacaoFrente),
        imagemPersonalizacaoCostas: imagem(cor.imagemPersonalizacaoCostas),
        estoque: cor.estoque,
      })),
      criadoEm: expect.any(String),
      atualizadoEm: expect.any(String),
    });
  });

  it('grava a busca normalizada, a posição e o nome normalizado de cada cor', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto({ cores: ['Preto', 'Azul Céu'] });

    const resposta = await cadastrar(agent, corpo);

    const produto = await db.orm.public.Produto.first({ id: resposta.body.id });
    expect(produto?.buscaNormalizada).toBe(`${corpo.nome.toLowerCase().replace('á', 'a')} algodao 100%`);
    const cores = await db.orm.public.ProdutoCor.where({ produtoId: resposta.body.id })
      .select('posicao', 'nomeNormalizado')
      .orderBy((c) => c.posicao.asc())
      .all();
    expect(cores).toEqual([
      { posicao: 0, nomeNormalizado: 'preto' },
      { posicao: 1, nomeNormalizado: 'azul ceu' },
    ]);
  });

  it('traz as categorias em ordem alfabética', async () => {
    const { agent } = await entrarComo('ADMIN');
    const sufixo = randomUUID();
    const zebra = await criarCategoria(`Zebra ${sufixo}`);
    const animes = await criarCategoria(`Ânimes ${sufixo}`);
    const corpo = await corpoDeProduto();

    const resposta = await cadastrar(agent, { ...corpo, categorias: [zebra.id, animes.id] });

    expect(resposta.status).toBe(201);
    expect(resposta.body.categorias).toEqual([animes, zebra]);
  });

  it('aceita personalizável sem a imagem de personalização das costas', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto();

    const semCostas = await cadastrar(agent, comCor(corpo, { imagemPersonalizacaoCostas: null }));
    const semCampo = await cadastrar(agent, comCor(corpo, { imagemPersonalizacaoCostas: undefined }));

    expect(semCostas.status).toBe(201);
    expect(semCostas.body.cores[0].imagemPersonalizacaoCostas).toBeNull();
    expect(semCampo.status).toBe(201);
  });

  it('recusa personalizável sem a imagem de personalização da frente', async () => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro(comCor(corpo, { imagemPersonalizacaoFrente: null }));

    expect(errors).toEqual({ 'cores.0.imagemPersonalizacaoFrente': 'Envie a imagem de personalização (frente).' });
  });

  it('recusa cor sem a imagem de apresentação', async () => {
    const corpo = await corpoDeProduto({ tipo: 'VENDA_DIRETA' });

    const errors = await cadastrarComErro(comCor(corpo, { imagemApresentacao: null }));

    expect(errors).toEqual({ 'cores.0.imagemApresentacao': 'Envie a imagem de apresentação.' });
  });

  it('recusa personalizável com a imagem de apresentação das costas', async () => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro(comCor(corpo, { imagemApresentacaoCostas: await gravarImagem() }));

    expect(errors).toEqual({ 'cores.0.imagemApresentacaoCostas': IMAGEM_PROIBIDA });
  });

  it('cadastra venda direta só com as imagens de apresentação', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto({ tipo: 'VENDA_DIRETA' });

    const comCostas = await cadastrar(agent, corpo);
    const semCostas = await cadastrar(agent, comCor(corpo, { imagemApresentacaoCostas: null }));

    expect(comCostas.status).toBe(201);
    expect(comCostas.body.tipo).toBe('VENDA_DIRETA');
    expect(comCostas.body.cores[0].imagemApresentacaoCostas).toEqual(imagem(corpo.cores[0]!.imagemApresentacaoCostas));
    expect(semCostas.status).toBe(201);
  });

  it.each(['imagemPersonalizacaoFrente', 'imagemPersonalizacaoCostas'])('recusa venda direta com %s', async (campo) => {
    const corpo = await corpoDeProduto({ tipo: 'VENDA_DIRETA' });

    const errors = await cadastrarComErro(comCor(corpo, { [campo]: await gravarImagem() }));

    expect(errors).toEqual({ [`cores.0.${campo}`]: IMAGEM_PROIBIDA });
  });

  it('cadastra produto sem tamanho com um número de estoque por cor', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto({ temTamanho: false, cores: ['Preto', 'Branco'] });

    const resposta = await cadastrar(agent, corpo);

    expect(resposta.status).toBe(201);
    expect(resposta.body.temTamanho).toBe(false);
    expect(resposta.body.cores.map((cor: { estoque: unknown }) => cor.estoque)).toEqual([
      [{ tamanho: null, quantidade: 10 }],
      [{ tamanho: null, quantidade: 10 }],
    ]);
  });

  it('devolve o estoque na ordem dos tamanhos, mesmo enviado fora de ordem', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto();
    const foraDeOrdem = [...estoque(true)].reverse().map((entrada, indice) => ({ ...entrada, quantidade: indice }));

    const resposta = await cadastrar(agent, comCor(corpo, { estoque: foraDeOrdem }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.cores[0].estoque).toEqual([...foraDeOrdem].reverse());
  });

  it.each([
    ['com tamanho faltando G2', true, estoque(true).slice(0, 5)],
    ['com tamanho repetido no lugar do G2', true, [...estoque(true).slice(0, 5), { tamanho: 'P', quantidade: 1 }]],
    ['com tamanho e uma entrada sem tamanho', true, estoque(false)],
    ['sem tamanho e com os seis tamanhos', false, estoque(true)],
    ['sem tamanho e duas entradas nulas', false, [...estoque(false), ...estoque(false)]],
    ['com o estoque vazio', true, []],
  ])('recusa o estoque %s', async (_caso, temTamanho, estoqueDaCor) => {
    const corpo = await corpoDeProduto({ temTamanho });

    const errors = await cadastrarComErro(comCor(corpo, { estoque: estoqueDaCor }));

    expect(errors).toEqual({ 'cores.0.estoque': 'Defina o estoque da cor Preto.' });
  });

  it.each([
    ['com tamanho fora da lista', { tamanho: 'XG', quantidade: 1 }],
    ['com uma entrada sem o campo tamanho', { quantidade: 1 }],
  ])('recusa o estoque %s com a mensagem da cor', async (_caso, entrada) => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro(comCor(corpo, { estoque: [...estoque(true).slice(0, 5), entrada] }));

    expect(errors).toEqual({
      'cores.0.estoque': 'Defina o estoque da cor Preto.',
      'cores.0.estoque.5.tamanho': 'Informe uma quantidade válida.',
    });
  });

  it('recusa cor sem estoque', async () => {
    const corpo = await corpoDeProduto();

    const semCampo = await cadastrarComErro(semEstoque(corpo));
    const nulo = await cadastrarComErro(comCor(corpo, { estoque: null }));

    expect(semCampo).toEqual({ 'cores.0.estoque': 'Defina o estoque da cor Preto.' });
    expect(nulo).toEqual({ 'cores.0.estoque': 'Defina o estoque da cor Preto.' });
  });

  it('recusa cor sem nome e sem estoque com as duas mensagens', async () => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro({ ...semEstoque(corpo), cores: [{ ...semEstoque(corpo).cores[0], nome: '  ' }] });

    expect(errors).toEqual({ 'cores.0.nome': 'Informe o nome da cor.', 'cores.0.estoque': 'Defina o estoque da cor.' });
  });

  it('recusa entrada de estoque que não é objeto', async () => {
    const corpo = await corpoDeProduto({ temTamanho: false });

    const errors = await cadastrarComErro(comCor(corpo, { estoque: [5] }));

    expect(errors).toEqual({
      'cores.0.estoque': 'Defina o estoque da cor Preto.',
      'cores.0.estoque.0': 'Informe uma quantidade válida.',
    });
  });

  it('recusa cor que não é objeto', async () => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro({ ...corpo, cores: [null] });

    expect(errors).toEqual({ 'cores.0': 'Cadastre ao menos uma cor.' });
  });

  it('devolve os erros das regras cruzadas junto com os erros de outros campos', async () => {
    const corpo = await corpoDeProduto({ cores: ['Preto', 'preto'] });
    const { nome: _nome, ...semNome } = corpo;

    const errors = await cadastrarComErro({
      ...semNome,
      cores: [{ ...corpo.cores[0]!, imagemApresentacao: null, imagemPersonalizacaoFrente: null }, corpo.cores[1]!],
    });

    expect(errors).toEqual({
      nome: 'Informe o nome do produto.',
      'cores.0.imagemApresentacao': 'Envie a imagem de apresentação.',
      'cores.0.imagemPersonalizacaoFrente': 'Envie a imagem de personalização (frente).',
      'cores.1.nome': 'Essa cor já foi cadastrada.',
    });
  });

  it.each([-1, 100000, 1.5, '10'])('recusa a quantidade %s', async (quantidade) => {
    const corpo = await corpoDeProduto();
    const estoqueDaCor = estoque(true).map((entrada, indice) => (indice === 2 ? { ...entrada, quantidade } : entrada));

    const errors = await cadastrarComErro(comCor(corpo, { estoque: estoqueDaCor }));

    expect(errors).toEqual({ 'cores.0.estoque.2.quantidade': 'Informe uma quantidade válida.' });
  });

  it('aceita as quantidades 0 e 99999', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto({ temTamanho: false, cores: ['Preto', 'Branco'] });
    corpo.cores[0]!.estoque = estoque(false, 0);
    corpo.cores[1]!.estoque = estoque(false, 99999);

    const resposta = await cadastrar(agent, corpo);

    expect(resposta.status).toBe(201);
    expect(resposta.body.cores.map((cor: { estoque: [{ quantidade: number }] }) => cor.estoque[0].quantidade)).toEqual([0, 99999]);
  });

  it('recusa duas cores com o mesmo nome, sem diferenciar maiúsculas e acentos', async () => {
    const corpo = await corpoDeProduto({ cores: ['Preto', 'préto'] });

    const errors = await cadastrarComErro(corpo);

    expect(errors).toEqual({ 'cores.1.nome': 'Essa cor já foi cadastrada.' });
  });

  it('recusa chave de imagem no formato certo que não existe no bucket', async () => {
    const corpo = await corpoDeProduto({ cores: ['Preto', 'Branco'] });
    const inexistente = `produtos/${randomUUID()}.png`;
    corpo.cores[1]!.imagemPersonalizacaoCostas = inexistente;

    const errors = await cadastrarComErro(corpo);

    expect(errors).toEqual({ 'cores.1.imagemPersonalizacaoCostas': 'Envie a imagem de personalização (costas).' });
  });

  it.each(['imagens/foto.png', `produtos/${randomUUID()}.gif`, 'produtos/../segredo.png'])(
    'recusa a chave de imagem fora do formato %s',
    async (chave) => {
      const corpo = await corpoDeProduto();

      const errors = await cadastrarComErro(comCor(corpo, { imagemApresentacao: chave }));

      expect(errors).toEqual({ 'cores.0.imagemApresentacao': 'Envie a imagem de apresentação.' });
    },
  );

  it('confere cada regra cruzada pelos campos de que ela depende', async () => {
    const corpo = await corpoDeProduto({ cores: ['Preto', 'preto'] });
    const { tipo: _tipo, ...semTipo } = corpo;

    const errosSemTipo = await cadastrarComErro({
      ...semTipo,
      cores: [corpo.cores[0]!, { ...corpo.cores[1]!, estoque: [] }, 5],
    });
    const errosSemTamanho = await cadastrarComErro({
      ...corpo,
      temTamanho: 'sim',
      cores: [{ ...corpo.cores[0]!, imagemPersonalizacaoFrente: null }, corpo.cores[1]!],
    });

    expect(errosSemTipo).toEqual({
      tipo: 'Selecione o tipo de produto.',
      'cores.1.nome': 'Essa cor já foi cadastrada.',
      'cores.1.estoque': 'Defina o estoque da cor preto.',
      'cores.2': 'Cadastre ao menos uma cor.',
    });
    expect(errosSemTamanho).toEqual({
      temTamanho: 'Informe se o produto tem tamanho.',
      'cores.0.imagemPersonalizacaoFrente': 'Envie a imagem de personalização (frente).',
      'cores.1.nome': 'Essa cor já foi cadastrada.',
    });
  });

  it('recusa categoria inexistente', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto();

    const resposta = await cadastrar(agent, { ...corpo, categorias: [...corpo.categorias, randomUUID()] });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos.',
      errors: { categorias: 'Selecione ao menos uma categoria.' },
    });
  });

  it('recusa categoria removida entre a conferência e a gravação, sem deixar o produto pela metade', async () => {
    const corpo = await corpoDeProduto();
    const removida = await criarCategoria();
    vi.spyOn(ProdutosRepository.prototype, 'contarCategorias').mockResolvedValueOnce(2);
    await db.orm.public.Categoria.where({ id: removida.id }).delete();

    const errors = await cadastrarComErro({ ...corpo, categorias: [...corpo.categorias, removida.id] });

    expect(errors).toEqual({ categorias: 'Selecione ao menos uma categoria.' });
    expect(await db.orm.public.Produto.where({ nome: corpo.nome }).first()).toBeNull();
  });

  it.each([
    ['vazias', []],
    ['com id que não é UUID', ['abc']],
    ['ausentes', undefined],
  ])('recusa categorias %s', async (_caso, categorias) => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro({ ...corpo, categorias });

    expect(errors).toEqual({ categorias: 'Selecione ao menos uma categoria.' });
  });

  it('recusa categorias repetidas', async () => {
    const corpo = await corpoDeProduto();
    const [categoria] = corpo.categorias;

    const errors = await cadastrarComErro({ ...corpo, categorias: [categoria, categoria] });

    expect(errors).toEqual({ categorias: 'Selecione ao menos uma categoria.' });
  });

  it.each([['0'], ['0.00'], ['100000.00'], ['1.234'], ['abc'], ['-1'], [''], [45.5]])('recusa o preço %j', async (preco) => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro({ ...corpo, preco });

    expect(errors).toEqual({ preco: 'Informe um preço válido.' });
  });

  it.each([
    ['45.5', '45.50'],
    ['99999.99', '99999.99'],
    ['0.01', '0.01'],
    ['7', '7.00'],
  ])('aceita o preço %s e devolve %s', async (preco, esperado) => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto();

    const resposta = await cadastrar(agent, { ...corpo, preco });

    expect(resposta.status).toBe(201);
    expect(resposta.body.preco).toBe(esperado);
  });

  it.each([
    ['nome', 'ab', 'Informe o nome do produto.'],
    ['nome', 'a'.repeat(121), 'Informe o nome do produto.'],
    ['descricao', 'a'.repeat(2001), 'A descrição pode ter até 2.000 caracteres.'],
    ['tipo', 'OUTRO', 'Selecione o tipo de produto.'],
    ['temTamanho', 'sim', 'Informe se o produto tem tamanho.'],
    ['cores', [], 'Cadastre ao menos uma cor.'],
  ])('recusa %s inválido', async (campo, valor, mensagem) => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro({ ...corpo, [campo]: valor });

    expect(errors).toEqual({ [campo]: mensagem });
  });

  it.each([
    ['nome', '   ', 'Informe o nome da cor.'],
    ['nome', 'a'.repeat(31), 'Informe o nome da cor.'],
    ['hex', '#00000', 'Escolha a cor da amostra.'],
    ['hex', 'preto', 'Escolha a cor da amostra.'],
  ])('recusa %s da cor inválido', async (campo, valor, mensagem) => {
    const corpo = await corpoDeProduto();

    const errors = await cadastrarComErro(comCor(corpo, { [campo]: valor }));

    expect(errors).toEqual({ [`cores.0.${campo}`]: mensagem });
  });

  it('aceita a descrição com 2.000 caracteres e guarda a vazia como nula', async () => {
    const { agent } = await entrarComo('ADMIN');
    const corpo = await corpoDeProduto();

    const longa = await cadastrar(agent, { ...corpo, descricao: 'a'.repeat(2000) });
    const vazia = await cadastrar(agent, { ...corpo, descricao: '   ' });
    const ausente = await cadastrar(agent, { ...corpo, descricao: undefined });

    expect(longa.status).toBe(201);
    expect(vazia.body.descricao).toBeNull();
    expect(ausente.body.descricao).toBeNull();
  });

  it('não grava nada quando a validação falha', async () => {
    const corpo = await corpoDeProduto();

    await cadastrarComErro(comCor(corpo, { imagemPersonalizacaoFrente: `produtos/${randomUUID()}.png` }));

    const produto = await db.orm.public.Produto.where({ nome: corpo.nome }).first();
    expect(produto).toBeNull();
  });

  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).post('/admin/produtos').send(await corpoDeProduto());

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await cadastrar(agent, await corpoDeProduto());

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });
});

describe('GET /admin/produtos/:id', () => {
  it('devolve o mesmo detalhe do cadastro', async () => {
    const { agent } = await entrarComo('ADMIN');
    const cadastrado = await cadastrar(agent, await corpoDeProduto({ cores: ['Preto', 'Branco'] }));

    const resposta = await agent.get(`/admin/produtos/${cadastrado.body.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(cadastrado.body);
  });

  it('marca o produto e só a cor que já foram vendidos', async () => {
    const { agent } = await entrarComo('ADMIN');
    const cadastrado = await cadastrar(agent, await corpoDeProduto({ cores: ['Preto', 'Branco'] }));
    await venderCor(cadastrado.body.cores[1].id);

    const resposta = await agent.get(`/admin/produtos/${cadastrado.body.id}`);

    expect(resposta.body.vendido).toBe(true);
    expect(resposta.body.cores.map((cor: { vendida: boolean }) => cor.vendida)).toEqual([false, true]);
  });

  it.each([
    ['inexistente', randomUUID()],
    ['com id que não é UUID', 'abc'],
  ])('responde 404 para produto %s', async (_caso, id) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.get(`/admin/produtos/${id}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADO);
  });

  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).get(`/admin/produtos/${randomUUID()}`);

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await agent.get(`/admin/produtos/${randomUUID()}`);

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });
});
