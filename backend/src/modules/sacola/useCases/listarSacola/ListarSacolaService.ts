import type { SacolaRepository } from "../../repositories/SacolaRepository.js";

export type ItemSacolaSaida = {
  id: string;
  tipo: 'PRODUTO' | 'MATERIAL';
  produtoVarianteId: string | null;
  produtoNome: string | null;
  produtoTipo: string | null;
  corNome: string | null;
  corHex: string | null;
  tamanho: string | null;
  quantidade: number | null;
  materialNome: string | null;
  comprimentoCm: number | null;
  precoUnitario: number;
  selecionado: boolean;
  estampas: any[];
  valorTotal: number;
};

export class ListarSacolaService {
  constructor(private readonly sacolaRepository: SacolaRepository) {}

  async execute(userId: string): Promise<{ itens: ItemSacolaSaida[]; total: number }> {
    const itens = await this.sacolaRepository.listar(userId);

    const itensSaida: ItemSacolaSaida[] = itens.map((item: any) => ({
      id: item.id,
      tipo: item.tipo,
      produtoVarianteId: item.produtoVarianteId ?? null,
      produtoNome: null,
      produtoTipo: null,
      corNome: null,
      corHex: null,
      tamanho: null,
      quantidade: item.quantidade ?? null,
      materialNome: null,
      comprimentoCm: item.comprimentoCm ? Number(item.comprimentoCm) : null,
      precoUnitario: Number(item.precoUnitario),
      selecionado: item.selecionado,
      estampas: [],
      valorTotal: Number(item.precoUnitario) * (item.quantidade ?? 1),
    }));

    let total = 0;
    for (const i of itensSaida) total += i.valorTotal;

    return { itens: itensSaida, total };
  }
}
