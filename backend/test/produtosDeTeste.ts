import { randomUUID } from 'node:crypto';
import { normalizarNome } from '../src/modules/categorias/normalizarNome.js';
import { gerarChaveDeImagem } from '../src/modules/imagens/chaveDeImagem.js';
import { TAMANHOS } from '../src/modules/produtos/schemas/produtoSchemas.js';
import { armazenamento } from '../src/shared/infra/armazenamento/index.js';
import { db } from '../src/shared/infra/prisma/db.js';
import { PNG } from './armazenamentoDeTeste.js';

type TipoProduto = 'PERSONALIZAVEL' | 'VENDA_DIRETA';

interface OpcoesDoProduto {
  tipo?: TipoProduto;
  temTamanho?: boolean;
  cores?: string[];
}

export async function gravarImagem() {
  const chave = gerarChaveDeImagem('png');
  await armazenamento.salvar(chave, PNG, 'image/png');
  return chave;
}

export async function criarCategoria(nome = `Esporte ${randomUUID()}`) {
  return db.orm.public.Categoria.select('id', 'nome').create({ nome, nomeNormalizado: normalizarNome(nome) });
}

export function estoque(temTamanho: boolean, quantidade = 10) {
  if (!temTamanho) {
    return [{ tamanho: null, quantidade }];
  }
  return TAMANHOS.map((tamanho) => ({ tamanho, quantidade }));
}

async function imagensDoTipo(tipo: TipoProduto) {
  if (tipo === 'VENDA_DIRETA') {
    return {
      imagemApresentacao: await gravarImagem(),
      imagemApresentacaoCostas: await gravarImagem(),
      imagemPersonalizacaoFrente: null,
      imagemPersonalizacaoCostas: null,
    };
  }
  return {
    imagemApresentacao: await gravarImagem(),
    imagemApresentacaoCostas: null,
    imagemPersonalizacaoFrente: await gravarImagem(),
    imagemPersonalizacaoCostas: await gravarImagem(),
  };
}

export async function corpoDeProduto({ tipo = 'PERSONALIZAVEL', temTamanho = true, cores = ['Preto'] }: OpcoesDoProduto = {}) {
  const categoria = await criarCategoria();
  return {
    tipo,
    nome: `Camisa básica ${randomUUID()}`,
    preco: '45.00',
    descricao: 'Algodão 100%',
    categorias: [categoria.id],
    temTamanho,
    cores: await Promise.all(
      cores.map(async (nome) => ({
        nome,
        hex: '#000000',
        ...(await imagensDoTipo(tipo)),
        estoque: estoque(temTamanho),
      })),
    ),
  };
}
