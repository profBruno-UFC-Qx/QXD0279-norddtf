import type { Armazenamento } from '../../../../shared/infra/armazenamento/Armazenamento.js';
import { DadosDoProdutoInvalidosError } from '../../errors/DadosDoProdutoInvalidosError.js';
import { ProdutoNaoEncontradoError } from '../../errors/ProdutoNaoEncontradoError.js';
import { montarDetalhe } from '../../montarDetalhe.js';
import type { ProdutosRepository } from '../../repositories/ProdutosRepository.js';
import { CAMPOS_DE_IMAGEM, CATEGORIAS_INVALIDAS, MENSAGENS_DE_IMAGEM, type DadosDoProduto } from '../../schemas/produtoSchemas.js';

export class CadastrarProdutoService {
  constructor(
    private readonly produtosRepository: ProdutosRepository,
    private readonly armazenamento: Armazenamento,
  ) {}

  async execute(dados: DadosDoProduto) {
    const [errosDeCategoria, errosDeImagem] = await Promise.all([
      this.conferirCategorias(dados.categorias),
      this.conferirImagens(dados.cores),
    ]);
    const errors = { ...errosDeCategoria, ...errosDeImagem };
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

  private async conferirCategorias(ids: string[]): Promise<Record<string, string>> {
    if ((await this.produtosRepository.contarCategorias(ids)) === ids.length) {
      return {};
    }
    return { categorias: CATEGORIAS_INVALIDAS };
  }

  private async conferirImagens(cores: DadosDoProduto['cores']) {
    const imagens = cores.flatMap((cor, indice) =>
      CAMPOS_DE_IMAGEM.flatMap((campo) => {
        const chave = cor[campo];
        return chave ? [{ caminho: `cores.${indice}.${campo}`, campo, chave }] : [];
      }),
    );
    const existem = await Promise.all(imagens.map(({ chave }) => this.armazenamento.existe(chave)));

    const errors: Record<string, string> = {};
    imagens.forEach(({ caminho, campo }, indice) => {
      if (!existem[indice]) {
        errors[caminho] = MENSAGENS_DE_IMAGEM[campo];
      }
    });
    return errors;
  }
}
