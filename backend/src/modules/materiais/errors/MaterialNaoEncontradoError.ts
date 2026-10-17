import { AppError } from '../../../shared/errors/AppError.js';

export class MaterialNaoEncontradoError extends AppError {
  constructor() {
    super(404, 'MATERIAL_NAO_ENCONTRADO', 'Material não encontrado.');
  }
}
