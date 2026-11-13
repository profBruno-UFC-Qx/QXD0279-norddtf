import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ArquivoInvalidoError } from '../../../../modules/imagens/errors/ArquivoInvalidoError.js';

const receber = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('arquivo');

export function receberArquivo(request: Request, response: Response, next: NextFunction): void {
  receber(request, response, (erro: unknown) => {
    if (erro) {
      next(new ArquivoInvalidoError());
      return;
    }
    next();
  });
}
