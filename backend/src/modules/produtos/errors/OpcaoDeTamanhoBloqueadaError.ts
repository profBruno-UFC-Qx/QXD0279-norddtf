import { AppError } from '../../../shared/errors/AppError.js';

export class OpcaoDeTamanhoBloqueadaError extends AppError {
  constructor() {
    super(409, 'OPCAO_DE_TAMANHO_BLOQUEADA', 'Este produto já foi vendido e não pode mudar a opção de tamanho.');
  }
}
