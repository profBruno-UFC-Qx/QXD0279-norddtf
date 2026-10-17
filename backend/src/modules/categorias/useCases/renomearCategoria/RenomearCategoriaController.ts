import type { Request, Response } from 'express';
import { categoriaSchema } from '../../schemas/categoriaSchemas.js';
import { validar } from '../../../../shared/infra/http/validar.js';
import type { RenomearCategoriaService } from './RenomearCategoriaService.js';

export class RenomearCategoriaController {
  constructor(private readonly renomearCategoriaService: RenomearCategoriaService) {}

  async handle(request: Request<{ id: string }>, response: Response): Promise<void> {
    const dados = validar(categoriaSchema, request.body);

    response.status(200).json(await this.renomearCategoriaService.execute(request.params.id, dados));
  }
}
