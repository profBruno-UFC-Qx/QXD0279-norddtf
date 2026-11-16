import type { Request, Response } from "express";
import type { UsersRepository } from "../../repositories/UsersRepository";
import { toSafeUser } from "../../toSafeUser.js";

const CAMPOS_OBRIGATORIOS_ENDERECO = [
    'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado',
] as const;

function calcularPerfilCompleto(usuario: {
    nome: string;
    telefone: string | null;
    endereco: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string | null;
        bairro: string;
        cidade: string;
        estado: string;
    } | null;
}): { perfilCompleto: boolean; pendencias: string[] } {
    const pendencias: string[] = [];

    if (!usuario.nome || usuario.nome.trim().length === 0) {
        pendencias.push('nome');
    }
    if (!usuario.telefone || usuario.telefone.trim().length === 0) {
        pendencias.push('telefone');
    }
    if (!usuario.endereco) {
        pendencias.push('endereco');
    } else {
        for (const campo of CAMPOS_OBRIGATORIOS_ENDERECO) {
            const valor = (usuario.endereco as Record<string, string | null>)[campo];
            if (!valor || valor.trim().length === 0) {
                pendencias.push(campo);
            }
        }
    }

    return {
        perfilCompleto: pendencias.length === 0,
        pendencias,
    };
}

class MeController {
    constructor(private readonly usersRepository: UsersRepository) {}

    async handle(request: Request, response: Response): Promise<void> {
        const user = await this.usersRepository.findById(request.session.userId!);

        if (!user) {
            response.status(404).json({ message: "User not found" });
            return;
        }

        const endereco = await this.usersRepository.findEnderecoByUserId(user.id);

        const { perfilCompleto, pendencias } = calcularPerfilCompleto({
            nome: user.nome,
            telefone: user.telefone,
            endereco,
        });

        response.status(200).json({
            ...toSafeUser(user),
            telefone: user.telefone,
            endereco: endereco ? {
                cep: endereco.cep,
                logradouro: endereco.logradouro,
                numero: endereco.numero,
                complemento: endereco.complemento,
                bairro: endereco.bairro,
                cidade: endereco.cidade,
                estado: endereco.estado,
            } : null,
            perfilCompleto,
            pendencias,
        });
    }
}

export { MeController };
