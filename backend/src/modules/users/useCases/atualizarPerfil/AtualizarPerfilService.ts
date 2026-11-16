import type { UsersRepository } from "../../repositories/UsersRepository";

export const telefoneSchema = {
    digitos: (telefone: string | null | undefined) => {
        if (!telefone) return '';
        return telefone.replace(/\D/g, '');
    },
    ehValido: (telefone: string | null | undefined) => {
        if (!telefone || telefone.trim().length === 0) return true; // opcional
        const digitos = telefoneSchema.digitos(telefone);
        if (digitos.length !== 10 && digitos.length !== 11) return false;
        const ddd = Number(digitos.slice(0, 2));
        if (ddd < 11 || ddd > 99) return false;
        if (digitos.length === 11 && digitos[2] !== '9') return false;
        return true;
    },
};

export class AtualizarPerfilService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async execute(id: string, nome: string | undefined, telefone: string | null) {
        const erros: Record<string, string> = {};

        if (!nome || nome.trim().length === 0) {
            erros.nome = 'Informe o nome.';
        } else if (nome.length > 120) {
            erros.nome = 'O nome pode ter até 120 caracteres.';
        }

        if (telefone && telefone.trim().length > 0 && !telefoneSchema.ehValido(telefone)) {
            erros.telefone = 'Informe um telefone válido com DDD.';
        }

        if (Object.keys(erros).length > 0) {
            const erro: any = new Error('VALIDATION_ERROR');
            erro.erros = erros;
            throw erro;
        }

        return this.usersRepository.atualizarPerfil(id, nome!.trim(), telefone ? telefone.trim() : null);
    }
}
