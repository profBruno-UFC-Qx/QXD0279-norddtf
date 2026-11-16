import type { Request, Response } from "express";
import type { AtualizarPerfilService } from "./AtualizarPerfilService.js";

export class AtualizarPerfilController {
    constructor(private readonly service: AtualizarPerfilService) {}

    async handle(request: Request, response: Response): Promise<void> {
        const { nome, telefone } = request.body as { nome?: string; telefone?: string | null };

        try {
            await this.service.execute(request.session.userId as string, nome, telefone ?? null);
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
