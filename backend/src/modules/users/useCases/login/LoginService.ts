import { verifyPassword, verifyPasswordWithoutAccount } from '../../../../shared/utils/password.js';
import type { UsersRepository } from '../../repositories/UsersRepository.js';

interface LoginInput {
  email: string;
  senha: string;
}

export class LoginService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ email, senha }: LoginInput): ReturnType<UsersRepository['findByEmail']> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user?.senha) {
      await verifyPasswordWithoutAccount(senha);
      return null;
    }

    const senhaValida = await verifyPassword(user.senha, senha);
    return senhaValida ? user : null;
  }
}
