import type { Request, Response } from 'express';
import { signupSchema } from '../../schemas/authSchemas.js';
import { validar } from '../../../../shared/infra/http/validar.js';
import { toSafeUser } from '../../toSafeUser.js';
import { regenerateSession, saveSession } from '../../../../shared/infra/http/session.js';
import type { SignupService } from './SignupService.js';

export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const dados = validar(signupSchema, request.body);

    const user = await this.signupService.execute(dados);
    await regenerateSession(request.session);
    request.session.userId = user.id;
    await saveSession(request.session);
    response.status(201).json(toSafeUser(user));
  }
}
