import { AppError } from '../../../shared/errors/AppError.js';

export class CategoriaJaCadastradaError extends AppError {
  constructor() {
    super(409, 'CATEGORIA_JA_CADASTRADA', 'Já existe uma categoria com esse nome.');
  }
}
