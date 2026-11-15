import { readFile } from 'node:fs/promises';
import type { Armazenamento } from '../../../shared/infra/armazenamento/Armazenamento.js';
import type { CategoriasRepository } from '../../categorias/repositories/CategoriasRepository.js';
import { normalizarNome } from '../../categorias/normalizarNome.js';
import { gerarChaveDeImagem } from '../../imagens/chaveDeImagem.js';
import type { ProdutosRepository } from '../repositories/ProdutosRepository.js';
import { produtoSchema, TAMANHOS, type Tamanho, type TipoProduto } from '../schemas/produtoSchemas.js';

export type ResultadoDoProduto = { nome: string; situacao: 'criado' | 'mantido' };

type Grade = [p: number, m: number, g: number, gg: number, g1: number, g2: number];

interface CorDeExemplo {
  nome: string;
  hex: string;
  imagem: string;
  estoque: Grade | number;
}

interface ProdutoDeExemplo {
  tipo: TipoProduto;
  nome: string;
  preco: string;
  descricao: string;
  categorias: string[];
  temTamanho: boolean;
  cores: CorDeExemplo[];
}

const produtosIniciais: ProdutoDeExemplo[] = [
  {
    tipo: 'PERSONALIZAVEL',
    nome: 'Camiseta Básica Algodão',
    preco: '49.90',
    descricao: 'Camiseta 100% algodão fio 30.1, gola careca e caimento reto. Recebe estampa DTF na frente e nas costas.',
    categorias: ['Camisetas', 'Básicas'],
    temTamanho: true,
    cores: [
      { nome: 'Branco', hex: '#FFFFFF', imagem: 'camiseta-basica-branco', estoque: [20, 30, 30, 15, 8, 0] },
      { nome: 'Preto', hex: '#1D1D1B', imagem: 'camiseta-basica-preto', estoque: [25, 35, 30, 20, 10, 5] },
      { nome: 'Azul Mescla', hex: '#9DB4CC', imagem: 'camiseta-basica-azul-mescla', estoque: [10, 15, 15, 8, 4, 2] },
    ],
  },
  {
    tipo: 'PERSONALIZAVEL',
    nome: 'Camiseta Oversized',
    preco: '79.90',
    descricao: 'Modelagem ampla com ombro caído e malha encorpada de 220 g/m². Boa para estampas grandes nas costas.',
    categorias: ['Camisetas', 'Oversized'],
    temTamanho: true,
    cores: [
      { nome: 'Off-white', hex: '#F3EEE3', imagem: 'oversized-off-white', estoque: [6, 10, 10, 6, 3, 2] },
      { nome: 'Verde Menta', hex: '#D5E8D4', imagem: 'oversized-verde-menta', estoque: [3, 5, 5, 2, 0, 0] },
    ],
  },
  {
    tipo: 'PERSONALIZAVEL',
    nome: 'Camiseta Cores Vivas',
    preco: '54.90',
    descricao: 'Algodão penteado em cores fortes, que destacam estampas claras.',
    categorias: ['Camisetas', 'Coloridas'],
    temTamanho: true,
    cores: [
      { nome: 'Rosa', hex: '#E07A9A', imagem: 'cores-vivas-rosa', estoque: [10, 14, 10, 6, 0, 0] },
      { nome: 'Amarelo', hex: '#F5B700', imagem: 'cores-vivas-amarelo', estoque: [4, 6, 4, 2, 0, 0] },
      { nome: 'Branco', hex: '#FFFFFF', imagem: 'cores-vivas-branco', estoque: [0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    tipo: 'VENDA_DIRETA',
    nome: 'Camiseta Pronta Lisa',
    preco: '59.90',
    descricao: 'Camiseta lisa pronta para usar, sem personalização.',
    categorias: ['Camisetas', 'Prontas'],
    temTamanho: true,
    cores: [
      { nome: 'Preto', hex: '#1D1D1B', imagem: 'pronta-preto', estoque: [4, 2, 6, 3, 0, 1] },
      { nome: 'Branco', hex: '#FFFFFF', imagem: 'pronta-branco', estoque: [1, 0, 2, 0, 0, 0] },
    ],
  },
  {
    tipo: 'VENDA_DIRETA',
    nome: 'Ecobag Algodão',
    preco: '34.90',
    descricao: 'Ecobag de algodão com alça longa, 38 x 42 cm.',
    categorias: ['Acessórios'],
    temTamanho: false,
    cores: [
      { nome: 'Cru', hex: '#E6D8B8', imagem: 'ecobag-cru', estoque: 30 },
      { nome: 'Branco', hex: '#FFFFFF', imagem: 'ecobag-branco', estoque: 12 },
    ],
  },
  {
    tipo: 'VENDA_DIRETA',
    nome: 'Boné Trucker',
    preco: '44.90',
    descricao: 'Boné trucker com frente em espuma, tela atrás e regulagem snapback.',
    categorias: ['Acessórios'],
    temTamanho: false,
    cores: [
      { nome: 'Branco', hex: '#FFFFFF', imagem: 'bone-branco', estoque: 15 },
      { nome: 'Preto e Branco', hex: '#1D1D1B', imagem: 'bone-preto', estoque: 7 },
    ],
  },
  {
    tipo: 'PERSONALIZAVEL',
    nome: 'Moletom Canguru',
    preco: '139.90',
    descricao: 'Moletom flanelado com capuz e bolso canguru. Sem estoque no momento, então não aparece na loja.',
    categorias: ['Moletons'],
    temTamanho: true,
    cores: [{ nome: 'Branco', hex: '#FFFFFF', imagem: 'moletom-branco', estoque: [0, 0, 0, 0, 0, 0] }],
  },
];

const PASTA_DAS_IMAGENS = new URL('./imagens/', import.meta.url);

export async function criarProdutos(
  produtosRepository: ProdutosRepository,
  categoriasRepository: CategoriasRepository,
  armazenamento: Armazenamento,
): Promise<ResultadoDoProduto[]> {
  const resultados: ResultadoDoProduto[] = [];
  for (const produto of produtosIniciais) {
    if (await produtosRepository.buscarPorNome(produto.nome)) {
      resultados.push({ nome: produto.nome, situacao: 'mantido' });
      continue;
    }

    const dados = produtoSchema.parse({
      tipo: produto.tipo,
      nome: produto.nome,
      preco: produto.preco,
      descricao: produto.descricao,
      categorias: await idsDasCategorias(categoriasRepository, produto.categorias),
      temTamanho: produto.temTamanho,
      cores: await Promise.all(produto.cores.map((cor) => montarCor(armazenamento, produto.tipo, cor))),
    });
    await produtosRepository.criar(dados);
    resultados.push({ nome: produto.nome, situacao: 'criado' });
  }
  return resultados;
}

async function idsDasCategorias(categoriasRepository: CategoriasRepository, nomes: string[]) {
  const ids: string[] = [];
  for (const nome of nomes) {
    const nomeNormalizado = normalizarNome(nome);
    const categoria =
      (await categoriasRepository.buscarPorNomeNormalizado(nomeNormalizado)) ??
      (await categoriasRepository.criar({ nome, nomeNormalizado }));
    ids.push(categoria.id);
  }
  return ids;
}

async function montarCor(armazenamento: Armazenamento, tipo: TipoProduto, cor: CorDeExemplo) {
  const imagem = await enviarImagem(armazenamento, cor.imagem);
  const personalizacao = tipo === 'PERSONALIZAVEL' ? { imagemPersonalizacaoFrente: imagem } : {};
  return { nome: cor.nome, hex: cor.hex, imagemApresentacao: imagem, ...personalizacao, estoque: montarEstoque(cor.estoque) };
}

async function enviarImagem(armazenamento: Armazenamento, arquivo: string) {
  const chave = gerarChaveDeImagem('jpg');
  await armazenamento.salvar(chave, await readFile(new URL(`${arquivo}.jpg`, PASTA_DAS_IMAGENS)), 'image/jpeg');
  return chave;
}

function montarEstoque(estoque: Grade | number): { tamanho: Tamanho | null; quantidade: number }[] {
  if (typeof estoque === 'number') {
    return [{ tamanho: null, quantidade: estoque }];
  }
  return TAMANHOS.map((tamanho, indice) => ({ tamanho, quantidade: estoque[indice] ?? 0 }));
}
