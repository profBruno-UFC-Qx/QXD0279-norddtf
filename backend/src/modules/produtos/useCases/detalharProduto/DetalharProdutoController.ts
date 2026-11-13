import type { Request, Response } from 'express';
import { ProdutoNaoEncontradoError } from '../../errors/ProdutoNaoEncontradoError.js';
import { montarDetalhe } from '../../montarDetalhe.js';
import type { ProdutosRepository } from '../../repositories/ProdutosRepository.js';

export class DetalharProdutoController {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  async handle(request: Request<{ id: string }>, response: Response): Promise<void> {
    const produto = await this.produtosRepository.detalhar(request.params.id);
    if (!produto) {
      throw new ProdutoNaoEncontradoError();
    }

    response.status(200).json(montarDetalhe(produto));
  }
}
