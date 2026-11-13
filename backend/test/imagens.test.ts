import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/shared/infra/http/app.js';
import { armazenamento } from '../src/shared/infra/armazenamento/index.js';
import { JPEG, PNG, WEBP } from './armazenamentoDeTeste.js';
import { entrarComo } from './entrarComo.js';

const ARQUIVO_INVALIDO = { code: 'ARQUIVO_INVALIDO', message: 'Formato não suportado. Envie PNG, JPEG ou WebP de até 5 MB.' };
const NAO_ENCONTRADA = { code: 'IMAGEM_NAO_ENCONTRADA', message: 'Imagem não encontrada.' };
const ACESSO_NEGADO = { code: 'ACESSO_NEGADO', message: 'Você não tem permissão para acessar esta área.' };
const CINCO_MB = 5 * 1024 * 1024;

function pngDeTamanho(tamanho: number) {
  const conteudo = Buffer.alloc(tamanho);
  PNG.copy(conteudo);
  return conteudo;
}

describe('POST /admin/imagens', () => {
  it('responde 401 sem sessão', async () => {
    const resposta = await request(app).post('/admin/imagens').attach('arquivo', PNG, 'foto.png');

    expect(resposta.status).toBe(401);
  });

  it('responde 403 para cliente', async () => {
    const { agent } = await entrarComo('USER');

    const resposta = await agent.post('/admin/imagens').attach('arquivo', PNG, 'foto.png');

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual(ACESSO_NEGADO);
  });

  it('identifica o tipo pelo conteúdo, ignorando o nome do arquivo', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.post('/admin/imagens').attach('arquivo', PNG, { filename: 'foto.jpg', contentType: 'image/jpeg' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.chave).toMatch(/^produtos\/[0-9a-f-]{36}\.png$/);
    expect(resposta.body.url).toBe(`/imagens/${resposta.body.chave}`);
  });

  it.each([
    ['JPEG', JPEG, 'jpg'],
    ['WebP', WEBP, 'webp'],
  ])('aceita %s', async (_tipo, conteudo, extensao) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.post('/admin/imagens').attach('arquivo', conteudo, `foto.${extensao}`);

    expect(resposta.status).toBe(201);
    expect(resposta.body.chave).toMatch(new RegExp(`^produtos/[0-9a-f-]{36}\\.${extensao}$`));
  });

  it('aceita uma imagem de exatamente 5 MB', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.post('/admin/imagens').attach('arquivo', pngDeTamanho(CINCO_MB), 'grande.png');

    expect(resposta.status).toBe(201);
  });

  it.each([
    ['um texto com nome .png', Buffer.from('não sou uma imagem'), 'arquivo', 'foto.png'],
    ['um arquivo acima de 5 MB', pngDeTamanho(CINCO_MB + 1), 'arquivo', 'grande.png'],
    ['um arquivo vazio', Buffer.alloc(0), 'arquivo', 'vazio.png'],
    ['um arquivo em outro campo', PNG, 'foto', 'foto.png'],
  ])('recusa %s', async (_caso, conteudo, campo, nome) => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.post('/admin/imagens').attach(campo, conteudo, nome);

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(ARQUIVO_INVALIDO);
  });

  it('recusa um multipart malformado', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent
      .post('/admin/imagens')
      .set('Content-Type', 'multipart/form-data; boundary=limite')
      .send('--limite\r\nContent-Disposition: form-data; name="arquivo"; filename="foto.png"\r\n\r\nincompleto');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(ARQUIVO_INVALIDO);
  });

  it('recusa o envio sem arquivo', async () => {
    const { agent } = await entrarComo('ADMIN');

    const resposta = await agent.post('/admin/imagens').field('nome', 'foto');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(ARQUIVO_INVALIDO);
  });
});

describe('GET /imagens/:chave', () => {
  it('devolve a imagem enviada sem sessão, com o tipo e o cache', async () => {
    const { agent } = await entrarComo('ADMIN');
    const envio = await agent.post('/admin/imagens').attach('arquivo', WEBP, 'foto.webp');

    const resposta = await request(app).get(envio.body.url);

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toBe('image/webp');
    expect(resposta.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(resposta.headers['set-cookie']).toBeUndefined();
    expect(Buffer.compare(resposta.body, WEBP)).toBe(0);
  });

  it.each([
    ['uma chave que não existe', `/imagens/produtos/${randomUUID()}.png`],
    ['uma chave fora do formato', '/imagens/produtos/abc.png'],
    ['um caminho que sobe de pasta', '/imagens/../x'],
    ['um caminho que sobe de pasta codificado', '/imagens/produtos/..%2F..%2Fx.png'],
  ])('responde 404 para %s', async (_caso, caminho) => {
    const resposta = await request(app).get(caminho);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual(NAO_ENCONTRADA);
  });
});

describe('armazenamento', () => {
  it('diz se a imagem existe', async () => {
    const { agent } = await entrarComo('ADMIN');
    const envio = await agent.post('/admin/imagens').attach('arquivo', PNG, 'foto.png');

    expect(await armazenamento.existe(envio.body.chave)).toBe(true);
    expect(await armazenamento.existe(`produtos/${randomUUID()}.png`)).toBe(false);
  });
});
