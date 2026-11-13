import { AppError } from '../../../shared/errors/AppError.js';

export class CorVendidaError extends AppError {
  constructor(cor: string) {
    super(409, 'COR_VENDIDA', 'Esta cor já foi vendida e não pode ser removida.', { cor });
  }
}
