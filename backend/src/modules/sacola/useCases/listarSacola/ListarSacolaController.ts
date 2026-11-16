import type { Request, Response } from "express";
import type { ListarSacolaService } from "./ListarSacolaService.js";

export class ListarSacolaController {
  constructor(private readonly service: ListarSacolaService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const resultado = await this.service.execute(request.session.userId as string);
    response.status(200).json(resultado);
  }
}
