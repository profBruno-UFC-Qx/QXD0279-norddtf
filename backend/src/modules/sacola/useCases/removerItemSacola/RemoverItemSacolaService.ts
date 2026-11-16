import type { SacolaRepository } from "../../repositories/SacolaRepository.js";

export class RemoverItemSacolaService {
  constructor(private readonly sacolaRepository: SacolaRepository) {}

  async execute(sacolaItemId: string, userId: string): Promise<void> {
    const item = await this.sacolaRepository.buscarPorId(sacolaItemId);

    if (!item) {
      const erro: any = new Error('ITEM_NAO_ENCONTRADO');
      erro.message = 'Item da sacola não encontrado.';
      throw erro;
    }

    if (item.userId !== userId) {
      const erro: any = new Error('ACESSO_NEGADO');
      erro.message = 'Item não pertence a este usuário.';
      throw erro;
    }

    await this.sacolaRepository.removerTodasEstampasDoItem(sacolaItemId);
    await this.sacolaRepository.remover(sacolaItemId);
  }
}
