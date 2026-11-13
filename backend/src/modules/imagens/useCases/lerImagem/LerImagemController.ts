import { pipeline } from 'node:stream';
import type { NextFunction, Request, Response } from 'express';
import type { Armazenamento } from '../../../../shared/infra/armazenamento/Armazenamento.js';
import { ehChaveDeImagem } from '../../chaveDeImagem.js';
import { ImagemNaoEncontradaError } from '../../errors/ImagemNaoEncontradaError.js';

export class LerImagemController {
  constructor(private readonly armazenamento: Armazenamento) {}

  async handle(request: Request<{ chave: string[] }>, response: Response, next: NextFunction): Promise<void> {
    const chave = request.params.chave.join('/');
    const objeto = ehChaveDeImagem(chave) ? await this.armazenamento.ler(chave) : null;
    if (!objeto) {
      throw new ImagemNaoEncontradaError();
    }

    response.status(200).set({
      'Content-Type': objeto.tipo,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    if (objeto.tamanho !== undefined) {
      response.set('Content-Length', String(objeto.tamanho));
    }

    pipeline(objeto.conteudo, response, (erro) => {
      if (erro && erro.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        next(erro);
      }
    });
  }
}
