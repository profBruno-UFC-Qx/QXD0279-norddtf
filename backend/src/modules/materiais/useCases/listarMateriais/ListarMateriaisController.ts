import type { Request, Response } from 'express';
import type { MateriaisRepository } from '../../repositories/MateriaisRepository.js';

export class ListarMateriaisController {
  constructor(private readonly materiaisRepository: MateriaisRepository) {}

  async handle(_request: Request, response: Response): Promise<void> {
    response.status(200).json(await this.materiaisRepository.listar());
  }
}
