import type { Request, Response } from 'express';
import { validar } from '../../../../shared/infra/http/validar.js';
import { situacaoSchema } from '../../schemas/produtoSchemas.js';
import type { MudarSituacaoService } from './MudarSituacaoService.js';

export class MudarSituacaoController {
  constructor(private readonly mudarSituacaoService: MudarSituacaoService) {}

  async handle(request: Request<{ id: string }>, response: Response): Promise<void> {
    const dados = validar(situacaoSchema, request.body);

    response.status(200).json(await this.mudarSituacaoService.execute(request.params.id, dados));
  }
}
