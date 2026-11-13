import { AppError } from '../../../shared/errors/AppError.js';

export class ProdutoNaoEncontradoError extends AppError {
  constructor() {
    super(404, 'PRODUTO_NAO_ENCONTRADO', 'Produto não encontrado.');
  }
}
