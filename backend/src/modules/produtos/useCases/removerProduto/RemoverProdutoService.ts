import { ProdutoNaoEncontradoError } from '../../errors/ProdutoNaoEncontradoError.js';
import type { ProdutosRepository } from '../../repositories/ProdutosRepository.js';

export class RemoverProdutoService {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  async execute(id: string) {
    if (!(await this.produtosRepository.remover(id))) {
      throw new ProdutoNaoEncontradoError();
    }
  }
}
