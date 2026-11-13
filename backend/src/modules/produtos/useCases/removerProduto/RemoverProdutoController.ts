import type { Request, Response } from 'express';
import type { RemoverProdutoService } from './RemoverProdutoService.js';

export class RemoverProdutoController {
  constructor(private readonly removerProdutoService: RemoverProdutoService) {}

  async handle(request: Request<{ id: string }>, response: Response): Promise<void> {
    await this.removerProdutoService.execute(request.params.id);
    response.status(204).send();
  }
}
