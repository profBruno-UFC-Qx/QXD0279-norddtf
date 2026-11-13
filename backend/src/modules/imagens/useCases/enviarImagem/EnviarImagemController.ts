import type { Request, Response } from 'express';
import type { EnviarImagemService } from './EnviarImagemService.js';

export class EnviarImagemController {
  constructor(private readonly enviarImagemService: EnviarImagemService) {}

  async handle(request: Request, response: Response): Promise<void> {
    response.status(201).json(await this.enviarImagemService.execute(request.file?.buffer));
  }
}
