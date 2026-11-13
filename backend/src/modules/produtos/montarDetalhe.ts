import { urlDaImagem } from '../imagens/chaveDeImagem.js';
import type { ProdutoDetalhado } from './repositories/ProdutosRepository.js';
import { TAMANHOS } from './schemas/produtoSchemas.js';

type Variante = ProdutoDetalhado['cores'][number]['variantes'][number];

function imagem(chave: string | null) {
  if (!chave) {
    return null;
  }
  return { chave, url: urlDaImagem(chave) };
}

function ordemDoTamanho({ tamanho }: Variante) {
  return tamanho === null ? -1 : TAMANHOS.indexOf(tamanho);
}

export function montarDetalhe({ cores, coresVendidas, ...produto }: ProdutoDetalhado) {
  return {
    id: produto.id,
    tipo: produto.tipo,
    nome: produto.nome,
    preco: produto.preco,
    descricao: produto.descricao,
    temTamanho: produto.temTamanho,
    ativo: produto.ativo,
    vendido: coresVendidas.size > 0,
    categorias: produto.categorias,
    cores: cores.map((cor) => ({
      id: cor.id,
      nome: cor.nome,
      hex: cor.hex,
      vendida: coresVendidas.has(cor.id),
      imagemApresentacao: imagem(cor.imagemApresentacao),
      imagemApresentacaoCostas: imagem(cor.imagemApresentacaoCostas),
      imagemPersonalizacaoFrente: imagem(cor.imagemPersonalizacaoFrente),
      imagemPersonalizacaoCostas: imagem(cor.imagemPersonalizacaoCostas),
      estoque: [...cor.variantes]
        .sort((a, b) => ordemDoTamanho(a) - ordemDoTamanho(b))
        .map(({ tamanho, estoque }) => ({ tamanho, quantidade: estoque })),
    })),
    criadoEm: produto.criadoEm,
    atualizadoEm: produto.atualizadoEm,
  };
}
