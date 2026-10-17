import type { Request, Response } from 'express';
import { categoriaSchema } from '../../schemas/categoriaSchemas.js';
import { validar } from '../../../../shared/infra/http/validar.js';
import type { CriarCategoriaService } from './CriarCategoriaService.js';

export class CriarCategoriaController {
  constructor(private readonly criarCategoriaService: CriarCategoriaService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const dados = validar(categoriaSchema, request.body);

    response.status(201).json(await this.criarCategoriaService.execute(dados));
  }
}
