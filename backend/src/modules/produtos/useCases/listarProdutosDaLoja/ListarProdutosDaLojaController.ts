import type { Request, Response } from 'express';
import { validar } from '../../../../shared/infra/http/validar.js';
import { urlDaImagem } from '../../../imagens/chaveDeImagem.js';
import { POR_PAGINA, type ProdutosRepository } from '../../repositories/ProdutosRepository.js';
import { filtrosDaListagemSchema, TAMANHOS } from '../../schemas/produtoSchemas.js';

const CORES_NO_CARD = 3;

export class ListarProdutosDaLojaController {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  async handle(request: Request, response: Response): Promise<void> {
    const filtros = validar(filtrosDaListagemSchema, request.query);
    const { itens, total, faixaDePreco } = await this.produtosRepository.listarDaLoja(filtros);

    response.status(200).json({
      itens: itens.map(({ cores, categorias, temTamanho, ...produto }) => {
        const categoriasDoProduto = categorias
          .map(({ categoria }) => {
            if (!categoria) {
              throw new Error(`Categoria ausente no produto ${produto.id}.`);
            }
            return { id: categoria.id, nome: categoria.nome };
          })
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        const tamanhos = temTamanho
          ? TAMANHOS.filter((tamanho) =>
              cores.some((cor) =>
                cor.variantes.some((variante) => variante.tamanho === tamanho && variante.estoque > 0),
              ),
            )
          : [];

        return {
          ...produto,
          imagem: urlDaImagem(cores[0]!.imagemApresentacao),
          categorias: categoriasDoProduto,
          cores: cores.slice(0, CORES_NO_CARD).map(({ nome, hex, variantes }) => ({
            nome,
            hex,
            estoque: variantes.reduce((total, variante) => total + variante.estoque, 0),
          })),
          totalDeCores: cores.length,
          tamanhos,
        };
      }),
      total,
      pagina: filtros.pagina,
      porPagina: POR_PAGINA,
      faixaDePreco,
    });
  }
}
