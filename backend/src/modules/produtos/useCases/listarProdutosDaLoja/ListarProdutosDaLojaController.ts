import type { Request, Response } from 'express';
import { validar } from '../../../../shared/infra/http/validar.js';
import { urlDaImagem } from '../../../imagens/chaveDeImagem.js';
import { POR_PAGINA, type ProdutosRepository } from '../../repositories/ProdutosRepository.js';
import { filtrosDaListagemSchema } from '../../schemas/produtoSchemas.js';

const CORES_NO_CARD = 3;

export class ListarProdutosDaLojaController {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  async handle(request: Request, response: Response): Promise<void> {
    const filtros = validar(filtrosDaListagemSchema, request.query);
    const { itens, total, faixaDePreco } = await this.produtosRepository.listarDaLoja(filtros);

    response.status(200).json({
      itens: itens.map(({ cores, ...produto }) => ({
        ...produto,
        imagem: urlDaImagem(cores[0]!.imagemApresentacao),
        cores: cores.slice(0, CORES_NO_CARD).map(({ nome, hex }) => ({ nome, hex })),
        totalDeCores: cores.length,
      })),
      total,
      pagina: filtros.pagina,
      porPagina: POR_PAGINA,
      faixaDePreco,
    });
  }
}
