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

type Orm = typeof db.orm;

export async function venderProduto(varianteId: string, orm: Orm = db.orm) {
  const user = await orm.public.User.create({ nome: 'Ana', email: `cliente-${randomUUID()}@x.com` });
  const pedido = await orm.public.Pedido.create({ userId: user.id, valorTotal: '45.00' });
  await orm.public.Item.create({
    pedidoId: pedido.id,
    tipo: 'PRODUTO',
    produtoVarianteId: varianteId,
    quantidade: 1,
    precoUnitario: '45.00',
  });
}

async function primeiraVariante(corId: string) {
  const variante = await db.orm.public.ProdutoVariante.where({ produtoCorId: corId }).first();
  return variante!.id;
}

export async function venderCor(corId: string) {
  await venderProduto(await primeiraVariante(corId));
}

type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function esperarBloqueioPor(tx: Transacao, terminou: () => boolean) {
  const [linha] = await tx.query(db.raw.sql`SELECT pg_backend_pid() AS pid`.returnsRow({ pid: 'pg/int4@1' }).build());
  const bloqueadas = db.raw.sql`SELECT 1 FROM pg_stat_activity WHERE ${linha!.pid}::int = ANY(pg_blocking_pids(pid))`
    .affectedCount()
    .build();
  while (!terminou()) {
    if ((await db.runtime().execute(bloqueadas)).affectedRows > 0) {
      return true;
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  return false;
}

export async function venderCorDuranteARequisicao<T extends { status: number }>(corId: string, enviar: () => PromiseLike<T>) {
  const varianteId = await primeiraVariante(corId);
  let resposta!: Promise<T>;
  let terminou = false;
  await db.transaction(async (tx) => {
    await venderProduto(varianteId, tx.orm);
    resposta = Promise.resolve(enviar()).finally(() => {
      terminou = true;
    });
    if (!(await esperarBloqueioPor(tx, () => terminou))) {
      throw new Error(`A requisição terminou com ${(await resposta).status} sem esperar a venda.`);
    }
  });
  return resposta;
}
