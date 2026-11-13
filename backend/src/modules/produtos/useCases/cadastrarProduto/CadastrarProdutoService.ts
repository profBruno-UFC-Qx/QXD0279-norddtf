import type { Armazenamento } from '../../../../shared/infra/armazenamento/Armazenamento.js';
import { conferirReferencias } from '../../conferirReferencias.js';
import { DadosDoProdutoInvalidosError } from '../../errors/DadosDoProdutoInvalidosError.js';
import { ProdutoNaoEncontradoError } from '../../errors/ProdutoNaoEncontradoError.js';
import { montarDetalhe } from '../../montarDetalhe.js';
import type { ProdutosRepository } from '../../repositories/ProdutosRepository.js';
import type { DadosDoProduto } from '../../schemas/produtoSchemas.js';

export class CadastrarProdutoService {
  constructor(
    private readonly produtosRepository: ProdutosRepository,
    private readonly armazenamento: Armazenamento,
  ) {}

  async execute(dados: DadosDoProduto) {
    const errors = await conferirReferencias(this.produtosRepository, this.armazenamento, dados);
    if (Object.keys(errors).length > 0) {
      throw new DadosDoProdutoInvalidosError(errors);
    }

    const id = await this.produtosRepository.criar(dados);
    const produto = await this.produtosRepository.detalhar(id);
    if (!produto) {
      throw new ProdutoNaoEncontradoError();
    }
    return montarDetalhe(produto);
  }
}
