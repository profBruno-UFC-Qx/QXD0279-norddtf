import type { Request, Response } from "express";
import type { AtualizarEnderecoService } from "./AtualizarEnderecoService.js";

export class AtualizarEnderecoController {
    constructor(private readonly service: AtualizarEnderecoService) {}

    async handle(request: Request, response: Response): Promise<void> {
        const dados = request.body as {
            cep?: string;
            logradouro?: string;
            numero?: string;
            complemento?: string | null;
            bairro?: string;
            cidade?: string;
            estado?: string;
        };

        try {
            await this.service.execute(request.session.userId as string, dados);
            response.status(204).send();
        } catch (erro: any) {
            if (erro.erros) {
                response.status(400).json({ code: 'VALIDATION_ERROR', erros: erro.erros, message: 'Erro de validação.' });
                return;
            }
            response.status(500).json({ message: 'Erro interno.' });
        }
    }
}
