import type { Request, Response } from 'express';
import { loginSchema } from '../../schemas/authSchemas.js';
import { toSafeUser } from '../../toSafeUser.js';
import { regenerateSession, saveSession } from '../../../../shared/infra/http/session.js';
import { toFieldErrors } from '../../../../shared/infra/http/fieldErrors.js';
import type { LoginService } from './LoginService.js';

export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const parsed = loginSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      response.status(400).json({ code: 'VALIDATION_ERROR', errors: toFieldErrors(parsed.error) });
      return;
    }

    try {
      const user = await this.loginService.execute(parsed.data);
      if (!user) {
        response.status(401).json({ code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos.' });
        return;
      }

      await regenerateSession(request.session);
      request.session.userId = user.id;
      await saveSession(request.session);
      response.status(200).json(toSafeUser(user));
    } catch {
      response.status(500).json({ message: 'Não foi possível entrar.' });
    }
  }
}
