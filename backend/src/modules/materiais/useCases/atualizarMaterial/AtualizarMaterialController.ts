import type { Request, Response } from 'express';
import { materialSchema, tipoMaterial } from '../../schemas/materialSchemas.js';
import { validar } from '../../../../shared/infra/http/validar.js';
import type { AtualizarMaterialService } from './AtualizarMaterialService.js';

export class AtualizarMaterialController {
  constructor(private readonly atualizarMaterialService: AtualizarMaterialService) {}

  async handle(request: Request<{ tipo: string }>, response: Response): Promise<void> {
    const dados = validar(materialSchema, request.body);

    response.status(200).json(await this.atualizarMaterialService.execute(tipoMaterial.parse(request.params.tipo), dados));
  }
}
