import { AppError } from '../../../shared/errors/AppError.js';

export class ProdutoVendidoError extends AppError {
  constructor() {
    super(409, 'PRODUTO_VENDIDO', 'Este produto já foi vendido e não pode ser removido. Inative-o para tirá-lo da loja.');
  }
}
