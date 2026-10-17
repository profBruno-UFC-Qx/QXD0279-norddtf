import type { Request, Response } from 'express';
import type { RemoverCategoriaService } from './RemoverCategoriaService.js';

export class RemoverCategoriaController {
  constructor(private readonly removerCategoriaService: RemoverCategoriaService) {}

  async handle(request: Request<{ id: string }>, response: Response): Promise<void> {
    await this.removerCategoriaService.execute(request.params.id);
    response.status(204).send();
  }
}
