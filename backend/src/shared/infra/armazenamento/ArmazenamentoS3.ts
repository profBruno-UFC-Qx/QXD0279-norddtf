import type { Readable } from 'node:stream';
import { GetObjectCommand, HeadObjectCommand, NoSuchKey, NotFound, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { Armazenamento, ObjetoArmazenado } from './Armazenamento.js';

export class ArmazenamentoS3 implements Armazenamento {
  constructor(
    private readonly cliente: S3Client,
    private readonly bucket: string,
  ) {}

  async salvar(chave: string, conteudo: Buffer, tipo: string): Promise<void> {
    await this.cliente.send(new PutObjectCommand({ Bucket: this.bucket, Key: chave, Body: conteudo, ContentType: tipo }));
  }

  async ler(chave: string): Promise<ObjetoArmazenado | null> {
    try {
      const objeto = await this.cliente.send(new GetObjectCommand({ Bucket: this.bucket, Key: chave }));
      return {
        conteudo: objeto.Body as Readable,
        tipo: objeto.ContentType ?? 'application/octet-stream',
        tamanho: objeto.ContentLength,
      };
    } catch (erro) {
      if (erro instanceof NoSuchKey) {
        return null;
      }
      throw erro;
    }
  }

  async existe(chave: string): Promise<boolean> {
    try {
      await this.cliente.send(new HeadObjectCommand({ Bucket: this.bucket, Key: chave }));
      return true;
    } catch (erro) {
      if (erro instanceof NotFound) {
        return false;
      }
      throw erro;
    }
  }
}
