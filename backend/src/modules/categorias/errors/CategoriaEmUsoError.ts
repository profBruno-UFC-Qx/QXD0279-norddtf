import { AppError } from '../../../shared/errors/AppError.js';
import { mensagemDeUso } from '../mensagemDeUso.js';

export class CategoriaEmUsoError extends AppError {
  constructor(produtos: number) {
    super(409, 'CATEGORIA_EM_USO', mensagemDeUso(produtos), { produtos });
  }
}
