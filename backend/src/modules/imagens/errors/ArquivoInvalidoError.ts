import { AppError } from '../../../shared/errors/AppError.js';

export class ArquivoInvalidoError extends AppError {
  constructor() {
    super(400, 'ARQUIVO_INVALIDO', 'Formato não suportado. Envie PNG, JPEG ou WebP de até 5 MB.');
  }
}
