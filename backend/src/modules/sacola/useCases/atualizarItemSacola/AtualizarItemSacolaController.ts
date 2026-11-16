import type { Request, Response } from "express";
import type { AtualizarItemSacolaService } from "./AtualizarItemSacolaService.js";

export class AtualizarItemSacolaController {
  constructor(private readonly service: AtualizarItemSacolaService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const dados = request.body as {
      quantidade?: number;
      selecionado?: boolean;
    };

    try {
      const resultado = await this.service.execute({
        sacolaItemId: request.params.id as string,
        userId: request.session.userId as string,
        quantidade: dados.quantidade ?? undefined,
        selecionado: dados.selecionado ?? true,
      } as any);

      response.status(200).json(resultado);
    } catch (erro: any) {
      if (erro.erros) {
        response.status(400).json({ code: 'VALIDATION_ERROR', erros: erro.erros, message: 'Erro de validação.' });
        return;
      }
      response.status(500).json({ message: 'Erro interno.' });
    }
  }
}
