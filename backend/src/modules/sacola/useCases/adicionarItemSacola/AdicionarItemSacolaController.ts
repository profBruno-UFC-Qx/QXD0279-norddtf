import type { Request, Response } from "express";
import type { AdicionarItemSacolaService } from "./AdicionarItemSacolaService.js";
export class AdicionarItemSacolaController {
  constructor(private readonly service: AdicionarItemSacolaService) {}

  async handle(request: Request, response: Response): Promise<void> {
    const dados = request.body as {
      tipo?: string;
      produtoVarianteId?: string;
      quantidade?: number;
      materialId?: string;
      comprimentoCm?: number;
      precoUnitario?: number;
      estampas?: Array<{
        arteClienteUrl?: string;
        posicao?: string;
        quantidade: number;
        larguraCm: number;
        alturaCm: number;
      }>;
    };

    try {
      const resultado = await this.service.execute({
        userId: request.session.userId as string,
        tipo: dados.tipo as 'PRODUTO' | 'MATERIAL',
        produtoVarianteId: dados.produtoVarianteId ?? null,
        quantidade: dados.quantidade ?? null,
        materialId: dados.materialId ?? null,
        comprimentoCm: dados.comprimentoCm ?? null,
        precoUnitario: dados.precoUnitario ?? 0,
        estampas: dados.estampas ?? [],
      });

      response.status(201).json(resultado);
    } catch (erro: any) {
      if (erro.erros) {
        response.status(400).json({ code: 'VALIDATION_ERROR', erros: erro.erros, message: 'Erro de validação.' });
        return;
      }
      response.status(500).json({ message: 'Erro interno.' });
    }
  }
}
