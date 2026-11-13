import type { Readable } from 'node:stream';

export interface ObjetoArmazenado {
  conteudo: Readable;
  tipo: string;
  tamanho?: number | undefined;
}

export interface Armazenamento {
  salvar(chave: string, conteudo: Buffer, tipo: string): Promise<void>;
  ler(chave: string): Promise<ObjetoArmazenado | null>;
  existe(chave: string): Promise<boolean>;
}
