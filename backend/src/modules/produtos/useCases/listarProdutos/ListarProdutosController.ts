import type { Request, Response } from 'express';
import { validar } from '../../../../shared/infra/http/validar.js';
import { urlDaImagem } from '../../../imagens/chaveDeImagem.js';
import { POR_PAGINA, type ProdutosRepository } from '../../repositories/ProdutosRepository.js';
import { filtrosDaListagemSchema } from '../../schemas/produtoSchemas.js';

export class ListarProdutosController {
  constructor(private readonly produtosRepository: ProdutosRepository) {}

  async handle(request: Request, response: Response): Promise<void> {
    const filtros = validar(filtrosDaListagemSchema, request.query);
    const { itens, total, faixaDePreco } = await this.produtosRepository.listar(filtros);

    response.status(200).json({
      itens: itens.map(({ cores, ...produto }) => ({
        ...produto,
        imagem: cores[0] ? urlDaImagem(cores[0].imagemApresentacao) : null,
      })),
      total,
      pagina: filtros.pagina,
      porPagina: POR_PAGINA,
      faixaDePreco,
    });
  }
}
