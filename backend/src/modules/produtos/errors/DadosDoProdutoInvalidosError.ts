import { AppError } from '../../../shared/errors/AppError.js';

export class DadosDoProdutoInvalidosError extends AppError {
  constructor(errors: Record<string, string>) {
    super(400, 'VALIDATION_ERROR', 'Dados inválidos.', { errors });
  }
}
