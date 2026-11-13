import type { Request, Response } from 'express';
import { validar } from '../../../../shared/infra/http/validar.js';
import { produtoSchema } from '../../schemas/produtoSchemas.js';
import type { CadastrarProdutoService } from './CadastrarProdutoService.js';

export class CadastrarProdutoController {
  constructor(private readonly cadastrarProdutoService: CadastrarProdutoService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const dados = validar(produtoSchema, request.body);

    response.status(201).json(await this.cadastrarProdutoService.execute(dados));
  }
}
