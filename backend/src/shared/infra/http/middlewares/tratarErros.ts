import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../../errors/AppError.js';
import { toFieldErrors } from '../fieldErrors.js';

function ehErroDeRequisicao(error: unknown): error is { status: number } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { status, expose } = error as { status?: unknown; expose?: unknown };
  return expose === true && typeof status === 'number' && status >= 400 && status < 500;
}

export function tratarErros(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    response.status(error.status).json({ code: error.code, message: error.message, ...error.detalhes });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({ code: 'VALIDATION_ERROR', errors: toFieldErrors(error) });
    return;
  }

  if (ehErroDeRequisicao(error)) {
    response.status(error.status).json({ message: 'Requisição inválida.' });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }
  response.status(500).json({ message: 'Não foi possível concluir agora.' });
}
