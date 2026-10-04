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
      const resultado = await this.loginService.execute(parsed.data);

      if (resultado.status === 'bloqueado') {
        response
          .set('Retry-After', String(resultado.retryAfterSeconds))
          .status(429)
          .json({ code: 'MUITAS_TENTATIVAS', message: 'Muitas tentativas. Tente novamente em alguns minutos.' });
        return;
      }

      if (resultado.status === 'invalido') {
        response.status(401).json({ code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos.' });
        return;
      }

      await regenerateSession(request.session);
      request.session.userId = resultado.user.id;
      await saveSession(request.session);
      response.status(200).json(toSafeUser(resultado.user));
    } catch {
      response.status(500).json({ message: 'Não foi possível entrar.' });
    }
  }
}
