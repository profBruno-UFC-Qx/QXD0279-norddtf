import type { Request, Response } from 'express';
import type { EditarProdutoService } from './EditarProdutoService.js';

export class EditarProdutoController {
  constructor(private readonly editarProdutoService: EditarProdutoService) {}

  async handle(request: Request<{ id: string }>, response: Response): Promise<void> {
    response.status(200).json(await this.editarProdutoService.execute(request.params.id, request.body));
  }
}
