import { urlDaImagem } from '../imagens/chaveDeImagem.js';
import { montarEstoque } from './montarDetalhe.js';
import type { ProdutoDaLoja } from './repositories/ProdutosRepository.js';

export function montarDetalheDaLoja(produto: ProdutoDaLoja) {
  return {
    id: produto.id,
    tipo: produto.tipo,
    nome: produto.nome,
    preco: produto.preco,
    descricao: produto.descricao,
    temTamanho: produto.temTamanho,
    categorias: produto.categorias,
    cores: produto.cores.map((cor) => ({
      id: cor.id,
      nome: cor.nome,
      hex: cor.hex,
      imagem: urlDaImagem(cor.imagemApresentacao),
      estoque: montarEstoque(cor.variantes),
    })),
  };
}
