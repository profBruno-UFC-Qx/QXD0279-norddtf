import type { Request, Response } from 'express';
import type { z } from 'zod';
import { signupSchema } from '../../schemas/authSchemas.js';
import { EmailJaCadastradoError } from '../../errors/EmailJaCadastradoError.js';
import { toSafeUser } from '../../toSafeUser.js';
import { regenerateSession, saveSession } from '../../../../shared/infra/http/session.js';
import type { SignupService } from './SignupService.js';

const MENSAGEM_CONTA_EXISTENTE =
  'Já existe uma conta com este e-mail. Tente entrar com e-mail e senha ou com o Google.';

function toFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const [campo] = issue.path;
    if (typeof campo !== 'string') {
      continue;
    }
    errors[campo] ??= issue.message;
  }
  return errors;
}

export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const parsed = signupSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      response.status(400).json({ code: 'VALIDATION_ERROR', errors: toFieldErrors(parsed.error) });
      return;
    }

    try {
      const user = await this.signupService.execute(parsed.data);
      await regenerateSession(request.session);
      request.session.userId = user.id;
      await saveSession(request.session);
      response.status(201).json(toSafeUser(user));
    } catch (error) {
      if (error instanceof EmailJaCadastradoError) {
        response.status(409).json({ code: 'EMAIL_JA_CADASTRADO', message: MENSAGEM_CONTA_EXISTENTE });
        return;
      }
      response.status(500).json({ message: 'Não foi possível criar a conta.' });
    }
  }
}
