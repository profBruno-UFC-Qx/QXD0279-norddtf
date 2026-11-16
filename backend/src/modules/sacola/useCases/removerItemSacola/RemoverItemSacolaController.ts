import type { Request, Response } from "express";
import type { RemoverItemSacolaService } from "./RemoverItemSacolaService.js";

export class RemoverItemSacolaController {
  constructor(private readonly service: RemoverItemSacolaService) {}

  async handle(request: Request, response: Response): Promise<void> {
    try {
      await this.service.execute(request.params.id as string, request.session.userId as string);
      response.status(204).send();
    } catch (erro: any) {
      if (erro.message === 'Item da sacola não encontrado.') {
        response.status(404).json({ message: erro.message });
        return;
      }
      if (erro.message === 'Item não pertence a este usuário.') {
        response.status(403).json({ message: erro.message });
        return;
      }
      response.status(500).json({ message: 'Erro interno.' });
    }
  }
}
