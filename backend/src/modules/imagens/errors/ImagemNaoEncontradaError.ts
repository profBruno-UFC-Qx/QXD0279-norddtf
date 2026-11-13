import { AppError } from '../../../shared/errors/AppError.js';

export class ImagemNaoEncontradaError extends AppError {
  constructor() {
    super(404, 'IMAGEM_NAO_ENCONTRADA', 'Imagem não encontrada.');
  }
}
