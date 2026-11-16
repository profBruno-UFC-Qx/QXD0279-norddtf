import type { SacolaRepository } from "../../repositories/SacolaRepository.js";

type AtualizarItemEntrada = {
  sacolaItemId: string;
  userId: string;
  quantidade?: number | null;
  selecionado?: boolean;
};

export class AtualizarItemSacolaService {
  constructor(private readonly sacolaRepository: SacolaRepository) {}

  async execute(entrada: AtualizarItemEntrada): Promise<any> {
    const erros: Record<string, string> = {};

    if (!entrada.sacolaItemId) {
      erros.item = 'Item não informado.';
    }

    const item = await this.sacolaRepository.buscarPorId(entrada.sacolaItemId);
    if (!item) {
      erros.item = 'Item da sacola não encontrado.';
    } else if (item.userId !== entrada.userId) {
      erros.item = 'Item não pertence a este usuário.';
    }

    if (entrada.quantidade !== undefined && (entrada.quantidade == null || entrada.quantidade < 1)) {
      erros.quantidade = 'Informe uma quantidade válida.';
    }

    if (Object.keys(erros).length > 0) {
      const erro: any = new Error('VALIDATION_ERROR');
      erro.erros = erros;
      throw erro;
    }

    return this.sacolaRepository.atualizar(entrada.sacolaItemId, {
      quantidade: entrada.quantidade ?? null,
      selecionado: entrada.selecionado ?? true,
    });
  }
}
