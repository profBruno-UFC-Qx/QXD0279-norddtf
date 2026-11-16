import { db } from "../../../shared/infra/prisma/db";

type SacolaItemAny = any;
type SacolaItemEstampaAny = any;

class SacolaRepository {
  async listar(userId: string): Promise<SacolaItemAny[]> {
    const resultado: any = await (db.orm.public.SacolaItem as any).where({ userId });
    const itens = Array.isArray(resultado) ? resultado : [resultado];
    return itens.sort((a: any, b: any) => {
      const dataA = new Date(a.criadoEm).getTime();
      const dataB = new Date(b.criadoEm).getTime();
      return dataB - dataA;
    });
  }

  async buscarPorId(id: string): Promise<SacolaItemAny | null> {
    return (db.orm.public.SacolaItem as any).first({ id });
  }

  async buscarPorUsuarioEVariante(userId: string, produtoVarianteId: string): Promise<SacolaItemAny | null> {
    return (db.orm.public.SacolaItem as any).first({ userId, produtoVarianteId });
  }

  async criar(dados: {
    userId: string;
    tipo: 'PRODUTO' | 'MATERIAL';
    produtoVarianteId?: string | null;
    quantidade?: number | null;
    materialId?: string | null;
    comprimentoCm?: number | null;
    precoUnitario: string;
    selecionado?: boolean;
  }): Promise<SacolaItemAny> {
    return (db.orm.public.SacolaItem as any).create({
      userId: dados.userId,
      tipo: dados.tipo,
      produtoVarianteId: dados.produtoVarianteId ?? undefined,
      quantidade: dados.quantidade ?? undefined,
      materialId: dados.materialId ?? undefined,
      comprimentoCm: dados.comprimentoCm ?? undefined,
      precoUnitario: dados.precoUnitario,
      selecionado: dados.selecionado ?? true,
    });
  }

  async atualizar(id: string, dados: {
    quantidade?: number | null;
    selecionado?: boolean;
    precoUnitario?: string;
  }): Promise<SacolaItemAny> {
    return (db.orm.public.SacolaItem as any).where({ id }).update({
      quantidade: dados.quantidade ?? undefined,
      selecionado: dados.selecionado ?? undefined,
      precoUnitario: dados.precoUnitario ?? undefined,
    });
  }

  async remover(id: string): Promise<void> {
    await (db.orm.public.SacolaItem as any).where({ id }).delete();
  }

  async removerTodasEstampasDoItem(sacolaItemId: string): Promise<void> {
    await (db.orm.public.SacolaItemEstampa as any).where({ sacolaItemId }).delete();
  }

  async adicionarEstampa(dados: {
    sacolaItemId: string;
    arteClienteUrl?: string | null;
    posicao?: 'FRENTE' | 'COSTAS' | null;
    quantidade: number;
    larguraCm: number;
    alturaCm: number;
  }): Promise<SacolaItemEstampaAny> {
    return (db.orm.public.SacolaItemEstampa as any).create({
      sacolaItemId: dados.sacolaItemId,
      arteClienteUrl: dados.arteClienteUrl ?? undefined,
      posicao: dados.posicao ?? undefined,
      quantidade: dados.quantidade,
      larguraCm: String(dados.larguraCm),
      alturaCm: String(dados.alturaCm),
    });
  }

  async buscarEstampasDoItem(sacolaItemId: string): Promise<SacolaItemEstampaAny[]> {
    const resultado: any = await (db.orm.public.SacolaItemEstampa as any).where({ sacolaItemId });
    return Array.isArray(resultado) ? resultado : [resultado];
  }
}

export { SacolaRepository };
