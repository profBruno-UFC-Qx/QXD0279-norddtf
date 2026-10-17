import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { MateriaisRepository } from '../src/modules/materiais/repositories/MateriaisRepository.js';
import { criarMateriais } from '../src/modules/materiais/seed/criarMateriais.js';
import { entrarComo } from './entrarComo.js';

const repository = new MateriaisRepository();

const NAO_ENCONTRADO = { code: 'MATERIAL_NAO_ENCONTRADO', message: 'Material não encontrado.' };
const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };

const DTF = {
  tipo: 'DTF',
  precoPorM2: '67.00',
  etiqueta: 'Indicado para tecidos',
  descricao: 'Ideal para personalizar roupas e tecidos com estampas vibrantes, resistentes e cheias de detalhes. Perfeito para camisetas, uniformes, ecobags e muito mais, garantindo conforto e ótima durabilidade no dia a dia.',
};

const DTF_UV = {
  tipo: 'DTF_UV',
  precoPorM2: '80.00',
  etiqueta: 'Indicado para superfícies rígidas',
  descricao: 'Perfeito para personalizar superfícies rígidas com acabamento moderno e alta qualidade. Pode ser aplicado em copos, garrafas, acrílico, vidro, plástico, madeira etc, criando adesivos resistentes e com cores vivas.',
};

const edicao = { precoPorM2: '72.50', descricao: 'Nova descrição do DTF.', etiqueta: 'Para roupas' };

async function apagarMateriais() {
  await db.orm.public.Material.where({ tipo: 'DTF' }).delete();
  await db.orm.public.Material.where({ tipo: 'DTF_UV' }).delete();
}

beforeEach(async () => {
  await apagarMateriais();
  await criarMateriais(repository);
});

describe('seed dos materiais', () => {
  it('cria DTF e DTF UV com o preço e os textos do seed', async () => {
    await apagarMateriais();

    const resultados = await criarMateriais(repository);

    expect(resultados).toEqual([
      { tipo: 'DTF', situacao: 'criado' },
      { tipo: 'DTF_UV', situacao: 'criado' },
    ]);
    expect(await repository.buscarPorTipo('DTF')).toMatchObject(DTF);
    expect(await repository.buscarPorTipo('DTF_UV')).toMatchObject(DTF_UV);
  });

  it('rodar de novo mantém os dois e não desfaz o preço editado', async () => {
    const { agent } = await entrarComo('ADMIN');
    const edicaoDoAdmin = await agent.put('/admin/materiais/DTF').send({ ...edicao, precoPorM2: '99.90' });
    expect(edicaoDoAdmin.status).toBe(200);

    const resultados = await criarMateriais(repository);

    expect(resultados).toEqual([
      { tipo: 'DTF', situacao: 'mantido' },
      { tipo: 'DTF_UV', situacao: 'mantido' },
    ]);
    expect((await repository.buscarPorTipo('DTF'))?.precoPorM2).toBe('99.90');
    expect(await repository.listar()).toHaveLength(2);
  });
});

describe('GET /materiais', () => {
  it('responde sem sessão, com DTF antes de DTF UV', async () => {
    const resposta = await request(app).get('/materiais');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(2);
    expect(resposta.body[0]).toEqual({ ...DTF, larguraFolhaCm: expect.any(String) });
    expect(resposta.body[1]).toEqual({ ...DTF_UV, larguraFolhaCm: expect.any(String) });
  });
});

describe('PUT /admin/materiais/:tipo', () => {
  it('atualiza preço, descrição e etiqueta, e o GET seguinte já devolve os novos', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.put('/admin/materiais/DTF').send(edicao);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ tipo: 'DTF', ...edicao, larguraFolhaCm: expect.any(String) });
    const lista = await request(app).get('/materiais');
    expect(lista.body[0]).toMatchObject({ tipo: 'DTF', ...edicao });
    expect(lista.body[1]).toMatchObject(DTF_UV);
  });

  it.each([
    ['70', '70.00'],
    ['70.5', '70.50'],
    ['1234.56', '1234.56'],
    ['9999.99', '9999.99'],
    [' 12.30 ', '12.30'],
  ])('grava o preço %j e devolve %j', async (enviado, gravado) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.put('/admin/materiais/DTF_UV').send({ ...edicao, precoPorM2: enviado });

    expect(resposta.status).toBe(200);
    expect(resposta.body.precoPorM2).toBe(gravado);
  });

  it.each([
    ['zero', '0'],
    ['zero com casas', '0.00'],
    ['negativo', '-1'],
    ['acima do teto', '10000'],
    ['com três casas', '1.234'],
    ['com letras', 'abc'],
    ['em número', 67],
    ['ausente', undefined],
  ])('responde 400 com preço %s', async (_caso, precoPorM2) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.put('/admin/materiais/DTF').send({ ...edicao, precoPorM2 });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ code: 'VALIDATION_ERROR', errors: { precoPorM2: 'Informe um preço válido.' } });
    expect((await repository.buscarPorTipo('DTF'))?.precoPorM2).toBe('67.00');
  });

  it.each([
    ['descrição vazia', { descricao: '' }, { descricao: 'Informe a descrição.' }],
    ['descrição só com espaços', { descricao: '   ' }, { descricao: 'Informe a descrição.' }],
    ['descrição com 301 caracteres', { descricao: 'a'.repeat(301) }, { descricao: 'A descrição pode ter até 300 caracteres.' }],
    ['etiqueta vazia', { etiqueta: '' }, { etiqueta: 'Informe a etiqueta.' }],
    ['etiqueta só com espaços', { etiqueta: '   ' }, { etiqueta: 'Informe a etiqueta.' }],
    ['etiqueta com 41 caracteres', { etiqueta: 'a'.repeat(41) }, { etiqueta: 'A etiqueta pode ter até 40 caracteres.' }],
  ])('responde 400 com %s', async (_caso, campo, errors) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.put('/admin/materiais/DTF').send({ ...edicao, ...campo });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ code: 'VALIDATION_ERROR', errors });
  });

  it('aceita descrição com 300 e etiqueta com 40 caracteres, sem os espaços nas pontas', async () => {
    const { agent } = await entrarComo('ADMIN');
    const descricao = 'd'.repeat(300);
    const etiqueta = 'e'.repeat(40);

    const resposta = await agent.put('/admin/materiais/DTF').send({ ...edicao, descricao: `  ${descricao} `, etiqueta: ` ${etiqueta}  ` });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ descricao, etiqueta });
  });

  it.each(['OUTRO', 'dtf'])('responde 404 com o tipo %s, sem criar material', async (tipo) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.put(`/admin/materiais/${tipo}`).send(edicao);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADO);
    expect(await repository.listar()).toHaveLength(2);
  });

  it('responde 404 quando o material ainda não foi criado', async () => {
    const { agent } = await entrarComo('ADMIN');
    await db.orm.public.Material.where({ tipo: 'DTF_UV' }).delete();

    const resposta = await agent.put('/admin/materiais/DTF_UV').send(edicao);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADO);
  });

  it('não tem rota para criar nem remover material', async () => {
    const { agent } = await entrarComo('ADMIN');

    const criar = await agent.post('/admin/materiais').send({ tipo: 'DTF', ...edicao });
    const remover = await agent.delete('/admin/materiais/DTF');

    expect(criar.status).toBe(404);
    expect(remover.status).toBe(404);
    expect(await repository.listar()).toHaveLength(2);
  });
});

describe('proteção da rota de admin de material', () => {
  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).put('/admin/materiais/DTF').send(edicao);

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await agent.put('/admin/materiais/DTF').send(edicao);

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
    expect((await repository.buscarPorTipo('DTF'))?.precoPorM2).toBe('67.00');
  });
});
