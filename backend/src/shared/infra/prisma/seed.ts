import { UsersRepository } from '../../../modules/users/repositories/UsersRepository.js';
import { VariaveisDoSeedInvalidasError } from '../../../modules/users/errors/VariaveisDoSeedInvalidasError.js';
import { criarContasIniciais, type ResultadoDaConta } from '../../../modules/users/seed/criarContasIniciais.js';
import { db } from './db.js';

const mensagemPorSituacao: Record<ResultadoDaConta['situacao'], (conta: ResultadoDaConta) => string> = {
  criada: ({ papel, email }) => `Conta de ${papel} ${email} criada.`,
  mantida: ({ papel, email }) => `Conta de ${papel} ${email} já existe e foi mantida sem alteração.`,
};

try {
  const resultados = await criarContasIniciais(process.env, new UsersRepository());
  for (const conta of resultados) {
    console.log(mensagemPorSituacao[conta.situacao](conta));
  }
} catch (erro) {
  console.error(erro instanceof VariaveisDoSeedInvalidasError ? erro.message : erro);
  process.exitCode = 1;
} finally {
  await db.close();
}
