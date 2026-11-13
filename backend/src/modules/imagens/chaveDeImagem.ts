import { randomUUID } from 'node:crypto';

export const FORMATO_DA_CHAVE = /^produtos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

export function gerarChaveDeImagem(extensao: string) {
  return `produtos/${randomUUID()}.${extensao}`;
}

export function ehChaveDeImagem(chave: string) {
  return FORMATO_DA_CHAVE.test(chave);
}

export function urlDaImagem(chave: string) {
  return `/imagens/${chave}`;
}
