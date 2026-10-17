import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { entrarComo } from './entrarComo.js';

const JA_CADASTRADA = { code: 'CATEGORIA_JA_CADASTRADA', message: 'Já existe uma categoria com esse nome.' };
const NAO_ENCONTRADA = { code: 'CATEGORIA_NAO_ENCONTRADA', message: 'Categoria não encontrada.' };
const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };

function sufixo() {
  return randomUUID().slice(0, 8);
}

async function criarCategoria(agent: Awaited<ReturnType<typeof entrarComo>>['agent'], nome: string) {
  const resposta = await agent.post('/admin/categorias').send({ nome });
  expect(resposta.status).toBe(201);
  return resposta.body as { id: string; nome: string };
}

async function ligar(categoriaId: string, { produtos, estampas }: { produtos: number; estampas: number }) {
  for (let i = 0; i < produtos; i++) {
    const produto = await db.orm.public.Produto.create({ nome: `Camiseta ${sufixo()}`, precoBase: '49.90' });
    await db.orm.public.ProdutoCategoria.create({ produtoId: produto.id, categoriaId });
  }
  for (let i = 0; i < estampas; i++) {
    const estampa = await db.orm.public.Estampa.create({
      nome: `Estampa ${sufixo()}`,
      imagemUrl: 'https://exemplo.com/estampa.png',
      larguraCm: '20.00',
      alturaCm: '25.00',
    });
    await db.orm.public.EstampaCategoria.create({ estampaId: estampa.id, categoriaId });
  }
}

describe('GET /categorias', () => {
  it('responde sem sessão, só com id e nome', async () => {
    const { agent } = await entrarComo('ADMIN');
    const criada = await criarCategoria(agent, `Animes ${sufixo()}`);

    const resposta = await request(app).get('/categorias');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toContainEqual(criada);
    for (const categoria of resposta.body) {
      expect(Object.keys(categoria).sort()).toEqual(['id', 'nome']);
    }
  });
});

describe('GET /admin/categorias', () => {
  it('traz o número de produtos e de estampas de cada categoria', async () => {
    const { agent } = await entrarComo('ADMIN');
    const emUso = await criarCategoria(agent, `Games ${sufixo()}`);
    const semUso = await criarCategoria(agent, `Filmes ${sufixo()}`);
    await ligar(emUso.id, { produtos: 2, estampas: 1 });

    const resposta = await agent.get('/admin/categorias');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toContainEqual({ ...emUso, produtos: 2, estampas: 1 });
    expect(resposta.body).toContainEqual({ ...semUso, produtos: 0, estampas: 0 });
  });

  it('ordena sem diferenciar maiúsculas e acentos', async () => {
    const { agent } = await entrarComo('ADMIN');
    const s = sufixo();
    const criadas = [
      await criarCategoria(agent, `Zebra ${s}`),
      await criarCategoria(agent, `abelha ${s}`),
      await criarCategoria(agent, `Ábaco ${s}`),
    ];
    const ids = criadas.map((categoria) => categoria.id);

    const resposta = await agent.get('/admin/categorias');

    const nomes = (resposta.body as { id: string; nome: string }[])
      .filter((categoria) => ids.includes(categoria.id))
      .map((categoria) => categoria.nome);
    expect(nomes).toEqual([`Ábaco ${s}`, `abelha ${s}`, `Zebra ${s}`]);
  });
});

describe('POST /admin/categorias', () => {
  it('cria a categoria com o nome sem espaços nas pontas', async () => {
    const { agent } = await entrarComo('ADMIN');
    const nome = `Heróis ${sufixo()}`;

    const resposta = await agent.post('/admin/categorias').send({ nome: `  ${nome}  ` });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ id: expect.any(String), nome });
  });

  it('barra o mesmo nome com outra caixa, sem acento ou com espaços', async () => {
    const { agent } = await entrarComo('ADMIN');
    const s = sufixo();
    await criarCategoria(agent, `Heróis ${s}`);

    for (const nome of [`herois ${s}`, `HERÓIS ${s.toUpperCase()}`, ` Heróis ${s} `]) {
      const resposta = await agent.post('/admin/categorias').send({ nome });

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual(JA_CADASTRADA);
    }
  });

  it.each([
    ['vazio', '', 'Informe o nome da categoria.'],
    ['só com espaços', '   ', 'Informe o nome da categoria.'],
    ['com 41 caracteres', 'a'.repeat(41), 'O nome pode ter até 40 caracteres.'],
    ['ausente', undefined, 'Informe o nome da categoria.'],
  ])('responde 400 com o nome %s', async (_caso, nome, mensagem) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.post('/admin/categorias').send({ nome });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ code: 'VALIDATION_ERROR', errors: { nome: mensagem } });
  });

  it('em criações simultâneas com o mesmo nome, cria uma e responde 409 na outra', async () => {
    const { agent } = await entrarComo('ADMIN');
    const nome = `Esportes ${sufixo()}`;

    const respostas = await Promise.all([
      agent.post('/admin/categorias').send({ nome }),
      agent.post('/admin/categorias').send({ nome }),
    ]);

    expect(respostas.map((resposta) => resposta.status).sort()).toEqual([201, 409]);
    expect(respostas.find((resposta) => resposta.status === 409)?.body).toEqual(JA_CADASTRADA);
  });
});

describe('PUT /admin/categorias/:id', () => {
  it('renomeia a categoria', async () => {
    const { agent } = await entrarComo('ADMIN');
    const categoria = await criarCategoria(agent, `Música ${sufixo()}`);
    const nome = `Bandas ${sufixo()}`;

    const resposta = await agent.put(`/admin/categorias/${categoria.id}`).send({ nome });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ id: categoria.id, nome });
  });

  it('aceita o mesmo nome com outra grafia na mesma categoria', async () => {
    const { agent } = await entrarComo('ADMIN');
    const s = sufixo();
    const categoria = await criarCategoria(agent, `Herois ${s}`);

    const resposta = await agent.put(`/admin/categorias/${categoria.id}`).send({ nome: `Heróis ${s}` });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ id: categoria.id, nome: `Heróis ${s}` });
  });

  it('barra renomear para o nome de outra categoria', async () => {
    const { agent } = await entrarComo('ADMIN');
    const s = sufixo();
    await criarCategoria(agent, `Heróis ${s}`);
    const outra = await criarCategoria(agent, `Vilões ${s}`);

    const resposta = await agent.put(`/admin/categorias/${outra.id}`).send({ nome: `herois ${s}` });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual(JA_CADASTRADA);
  });

  it('responde 400 com nome inválido', async () => {
    const { agent } = await entrarComo('ADMIN');
    const categoria = await criarCategoria(agent, `Natureza ${sufixo()}`);

    const resposta = await agent.put(`/admin/categorias/${categoria.id}`).send({ nome: ' ' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ code: 'VALIDATION_ERROR', errors: { nome: 'Informe o nome da categoria.' } });
  });

  it.each([
    ['inexistente', randomUUID()],
    ['que não é UUID', 'nao-e-uuid'],
  ])('responde 404 com id %s', async (_caso, id) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.put(`/admin/categorias/${id}`).send({ nome: `Viagem ${sufixo()}` });

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADA);
  });
});

describe('DELETE /admin/categorias/:id', () => {
  it('remove a categoria sem uso, que some do GET /categorias', async () => {
    const { agent } = await entrarComo('ADMIN');
    const categoria = await criarCategoria(agent, `Comida ${sufixo()}`);

    const resposta = await agent.delete(`/admin/categorias/${categoria.id}`);

    expect(resposta.status).toBe(204);
    const lista = await request(app).get('/categorias');
    expect(lista.body).not.toContainEqual(categoria);
  });

  it('bloqueia a remoção da categoria ligada a 2 produtos e 1 estampa', async () => {
    const { agent } = await entrarComo('ADMIN');
    const categoria = await criarCategoria(agent, `Pets ${sufixo()}`);
    await ligar(categoria.id, { produtos: 2, estampas: 1 });

    const resposta = await agent.delete(`/admin/categorias/${categoria.id}`);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      code: 'CATEGORIA_EM_USO',
      message: 'Esta categoria está em uso por 2 produtos e 1 estampa. Retire-a deles antes de remover.',
      produtos: 2,
      estampas: 1,
    });
    expect((await request(app).get('/categorias')).body).toContainEqual(categoria);
  });

  it('concorda em número com 1 produto e nenhuma estampa', async () => {
    const { agent } = await entrarComo('ADMIN');
    const categoria = await criarCategoria(agent, `Carros ${sufixo()}`);
    await ligar(categoria.id, { produtos: 1, estampas: 0 });

    const resposta = await agent.delete(`/admin/categorias/${categoria.id}`);

    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toBe(
      'Esta categoria está em uso por 1 produto e 0 estampas. Retire-a deles antes de remover.',
    );
  });

  it.each([
    ['inexistente', randomUUID()],
    ['que não é UUID', 'nao-e-uuid'],
  ])('responde 404 com id %s', async (_caso, id) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.delete(`/admin/categorias/${id}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADA);
  });
});

describe('proteção das rotas de admin de categoria', () => {
  const id = randomUUID();
  const chamadas = [
    ['GET', (cliente: ReturnType<typeof request>) => cliente.get('/admin/categorias')],
    ['POST', (cliente: ReturnType<typeof request>) => cliente.post('/admin/categorias').send({ nome: 'Teste' })],
    ['PUT', (cliente: ReturnType<typeof request>) => cliente.put(`/admin/categorias/${id}`).send({ nome: 'Teste' })],
    ['DELETE', (cliente: ReturnType<typeof request>) => cliente.delete(`/admin/categorias/${id}`)],
  ] as const;

  it.each(chamadas)('%s responde 401 sem sessão', async (_metodo, chamar) => {
    const resposta = await chamar(request(app));

    expect(resposta.status).toBe(401);
  });

  it.each(chamadas)('%s responde 403 para cliente', async (_metodo, chamar) => {
    const { agent } = await entrarComo('USER');

    const resposta = await chamar(agent);

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });
});
