import { db } from "../../../../shared/infra/prisma/db";
import type { SacolaRepository } from "../../repositories/SacolaRepository.js";

type AdicionarItemEntrada = {
  userId: string;
  tipo: 'PRODUTO' | 'MATERIAL';
  produtoVarianteId?: string | null;
  quantidade?: number | null;
  materialId?: string | null;
  comprimentoCm?: number | null;
  precoUnitario: number;
  estampas?: Array<{
    arteClienteUrl?: string | null;
    posicao?: string | null;
    quantidade: number;
    larguraCm: number;
    alturaCm: number;
  }>;
};

export class AdicionarItemSacolaService {
  constructor(private readonly sacolaRepository: SacolaRepository) {}

  async execute(entrada: AdicionarItemEntrada) {
    const erros: Record<string, string> = {};

    if (!entrada.userId) {
      erros.usuario = 'Usuário não informado.';
    }

    if (!entrada.tipo) {
      erros.tipo = 'Informe o tipo do item.';
    } else if (entrada.tipo !== 'PRODUTO' && entrada.tipo !== 'MATERIAL') {
      erros.tipo = 'Tipo inválido.';
    }

    if (entrada.precoUnitario == null || entrada.precoUnitario <= 0) {
      erros.precoUnitario = 'Informe um preço válido.';
    }

    // Se é produto, verificar estoque da variante
    if (entrada.tipo === 'PRODUTO' && entrada.produtoVarianteId) {
      const variante = await db.orm.public.ProdutoVariante.first({ id: entrada.produtoVarianteId });
      if (!variante) {
        erros.produtoVarianteId = 'Variante do produto não encontrada.';
      } else if (variante.estoque == null || variante.estoque <= 0) {
        erros.produtoVarianteId = 'Produto sem estoque disponível.';
      } else {
        const quantidadeSolicitada = entrada.quantidade ?? 1;
        const existente = await this.sacolaRepository.buscarPorUsuarioEVariante(entrada.userId, entrada.produtoVarianteId);
        const quantidadeTotal = (existente?.quantidade ?? 0) + quantidadeSolicitada;
        if (quantidadeTotal > variante.estoque) {
          erros.estoque = `Estoque insuficiente. Só restam ${variante.estoque} unidade(s).`;
        }
      }
    }

    if (Object.keys(erros).length > 0) {
      const erro: any = new Error('VALIDATION_ERROR');
      erro.erros = erros;
      throw erro;
    }

    let sacolaItem: any;
    if (entrada.tipo === 'PRODUTO' && entrada.produtoVarianteId) {
      const existente = await this.sacolaRepository.buscarPorUsuarioEVariante(entrada.userId, entrada.produtoVarianteId);
      if (existente) {
        const novaQuantidade = (existente.quantidade ?? 0) + (entrada.quantidade ?? 1);
        sacolaItem = await this.sacolaRepository.atualizar(existente.id, {
          quantidade: novaQuantidade,
        });
      } else {
        sacolaItem = await this.sacolaRepository.criar({
          userId: entrada.userId,
          tipo: entrada.tipo,
          produtoVarianteId: entrada.produtoVarianteId ?? null,
          quantidade: entrada.quantidade ?? 1,
          precoUnitario: String(entrada.precoUnitario),
        });
      }
    } else {
      sacolaItem = await this.sacolaRepository.criar({
        userId: entrada.userId,
        tipo: entrada.tipo,
        materialId: entrada.materialId ?? null,
        comprimentoCm: entrada.comprimentoCm ?? null,
        precoUnitario: String(entrada.precoUnitario),
      });
    }

    if (entrada.estampas && entrada.estampas.length > 0) {
      for (const estampa of entrada.estampas) {
        await this.sacolaRepository.adicionarEstampa({
          sacolaItemId: sacolaItem.id,
          arteClienteUrl: estampa.arteClienteUrl ?? null,
          posicao: (estampa.posicao === 'FRENTE' || estampa.posicao === 'COSTAS') ? estampa.posicao : null,
          quantidade: estampa.quantidade,
          larguraCm: estampa.larguraCm,
          alturaCm: estampa.alturaCm,
        });
      }
    }

    return sacolaItem;
  }
}
