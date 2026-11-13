import { ProdutoNaoEncontradoError } from '../../errors/ProdutoNaoEncontradoError.js';
import type { ProdutosRepository } from '../../repositories/ProdutosRepository.js';

interface MudarSituacaoInput {
  ativo: boolean;
}

export class MudarSituacaoService {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  async execute(id: string, { ativo }: MudarSituacaoInput) {
    const produto = await this.produtosRepository.mudarSituacao(id, ativo);
    if (!produto) {
      throw new ProdutoNaoEncontradoError();
    }
    return produto;
  }
}
