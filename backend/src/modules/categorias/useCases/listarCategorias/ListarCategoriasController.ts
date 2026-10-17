import type { Request, Response } from 'express';
import type { CategoriasRepository } from '../../repositories/CategoriasRepository.js';

export class ListarCategoriasController {
  constructor(private readonly categoriasRepository: CategoriasRepository) {}

  async handle(_request: Request, response: Response): Promise<void> {
    response.status(200).json(await this.categoriasRepository.listar());
  }
}
