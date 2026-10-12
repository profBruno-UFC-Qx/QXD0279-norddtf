import type { ZodType } from 'zod';
import { email as schemaDeEmail, senhaComPolitica } from '../schemas/authSchemas.js';
import { VariaveisDoSeedInvalidasError } from '../errors/VariaveisDoSeedInvalidasError.js';
import { hashPassword } from '../../../shared/utils/password.js';
import type { UsersRepository } from '../repositories/UsersRepository.js';

type Variaveis = Record<string, string | undefined>;

export type ResultadoDaConta = { papel: string; email: string; situacao: 'criada' | 'mantida' };

const contasIniciais = [
  { papel: 'admin', nome: 'Administrador NorDTF', tipoPerfil: 'ADMIN', variavelEmail: 'SEED_ADMIN_EMAIL', variavelSenha: 'SEED_ADMIN_SENHA' },
  { papel: 'cliente', nome: 'Cliente de teste', tipoPerfil: 'USER', variavelEmail: 'SEED_CLIENTE_EMAIL', variavelSenha: 'SEED_CLIENTE_SENHA' },
] as const;

function lerVariavel(nome: string, variaveis: Variaveis, schema: ZodType<string>, erros: string[]) {
  const valor = variaveis[nome];
  if (!valor) {
    erros.push(`${nome} não está definida.`);
    return null;
  }

  const lido = schema.safeParse(valor);
  if (!lido.success) {
    erros.push(`${nome}: ${lido.error.issues[0]?.message}`);
    return null;
  }
  return lido.data;
}

function lerConta(conta: (typeof contasIniciais)[number], variaveis: Variaveis, erros: string[]) {
  const email = lerVariavel(conta.variavelEmail, variaveis, schemaDeEmail, erros);
  const senha = lerVariavel(conta.variavelSenha, variaveis, senhaComPolitica, erros);
  if (email === null || senha === null) return null;
  return { ...conta, email, senha };
}

export async function criarContasIniciais(variaveis: Variaveis, usersRepository: UsersRepository): Promise<ResultadoDaConta[]> {
  const erros: string[] = [];
  const contas = contasIniciais.map((conta) => lerConta(conta, variaveis, erros)).filter((conta) => conta !== null);

  if (erros.length > 0) {
    throw new VariaveisDoSeedInvalidasError(erros);
  }

  const resultados: ResultadoDaConta[] = [];
  for (const conta of contas) {
    const existente = await usersRepository.findByEmail(conta.email);
    if (existente) {
      resultados.push({ papel: conta.papel, email: conta.email, situacao: 'mantida' });
      continue;
    }

    await usersRepository.createWithPassword({
      nome: conta.nome,
      email: conta.email,
      senhaHash: await hashPassword(conta.senha),
      tipoPerfil: conta.tipoPerfil,
    });
    resultados.push({ papel: conta.papel, email: conta.email, situacao: 'criada' });
  }

  return resultados;
}
