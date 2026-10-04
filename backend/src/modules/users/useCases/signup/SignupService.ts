import { hashPassword } from '../../../../shared/utils/password.js';
import { EmailJaCadastradoError } from '../../errors/EmailJaCadastradoError.js';
import type { UsersRepository } from '../../repositories/UsersRepository.js';

interface SignupInput {
  nome: string;
  email: string;
  senha: string;
}

export class SignupService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ nome, email, senha }: SignupInput): ReturnType<UsersRepository['createWithPassword']> {
    const existente = await this.usersRepository.findByEmail(email);
    if (existente) {
      throw new EmailJaCadastradoError();
    }

    const senhaHash = await hashPassword(senha);
    return this.usersRepository.createWithPassword({ nome, email, senhaHash });
  }
}
