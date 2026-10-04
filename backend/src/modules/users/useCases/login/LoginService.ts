import { verifyPassword, verifyPasswordWithoutAccount } from '../../../../shared/utils/password.js';
import type { UsersRepository } from '../../repositories/UsersRepository.js';
import { loginAttemptLimiter } from './LoginAttemptLimiter.js';

interface LoginInput {
  email: string;
  senha: string;
}

type UserRow = NonNullable<Awaited<ReturnType<UsersRepository['findByEmail']>>>;

export type LoginResult =
  | { status: 'autenticado'; user: UserRow }
  | { status: 'invalido' }
  | { status: 'bloqueado'; retryAfterSeconds: number };

export class LoginService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ email, senha }: LoginInput): Promise<LoginResult> {
    const retryAfterSeconds = loginAttemptLimiter.retryAfterSeconds(email);
    if (retryAfterSeconds > 0) {
      return { status: 'bloqueado', retryAfterSeconds };
    }
    const tentativa = loginAttemptLimiter.registerAttempt(email);

    try {
      const user = await this.usersRepository.findByEmail(email);
      const senhaValida = user?.senha
        ? await verifyPassword(user.senha, senha)
        : await verifyPasswordWithoutAccount(senha);

      if (!user || !senhaValida) {
        return { status: 'invalido' };
      }

      loginAttemptLimiter.reset(email);
      return { status: 'autenticado', user };
    } catch (erro) {
      loginAttemptLimiter.cancelAttempt(email, tentativa);
      throw erro;
    }
  }
}
