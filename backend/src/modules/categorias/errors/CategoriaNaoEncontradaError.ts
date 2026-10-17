import { AppError } from '../../../shared/errors/AppError.js';

export class CategoriaNaoEncontradaError extends AppError {
  constructor() {
    super(404, 'CATEGORIA_NAO_ENCONTRADA', 'Categoria não encontrada.');
  }
}
