import { AppError } from '../../../shared/errors/AppError.js';

export class EmailJaCadastradoError extends AppError {
  constructor() {
    super(
      409,
      'EMAIL_JA_CADASTRADO',
      'Já existe uma conta com este e-mail. Tente entrar com e-mail e senha ou com o Google.',
    );
  }
}
