import type { Armazenamento } from '../../shared/infra/armazenamento/Armazenamento.js';
import type { ProdutosRepository } from './repositories/ProdutosRepository.js';
import { CAMPOS_DE_IMAGEM, CATEGORIAS_INVALIDAS, MENSAGENS_DE_IMAGEM, type DadosDoProduto } from './schemas/produtoSchemas.js';

type Referencias = Pick<DadosDoProduto, 'categorias' | 'cores'>;

export async function conferirReferencias(
  produtosRepository: ProdutosRepository,
  armazenamento: Armazenamento,
  { categorias, cores }: Referencias,
) {
  const [errosDeCategoria, errosDeImagem] = await Promise.all([
    conferirCategorias(produtosRepository, categorias),
    conferirImagens(armazenamento, cores),
  ]);
  return { ...errosDeCategoria, ...errosDeImagem };
}

async function conferirCategorias(produtosRepository: ProdutosRepository, ids: string[]): Promise<Record<string, string>> {
  if ((await produtosRepository.contarCategorias(ids)) === ids.length) {
    return {};
  }
  return { categorias: CATEGORIAS_INVALIDAS };
}

async function conferirImagens(armazenamento: Armazenamento, cores: Referencias['cores']) {
  const imagens = cores.flatMap((cor, indice) =>
    CAMPOS_DE_IMAGEM.flatMap((campo) => {
      const chave = cor[campo];
      return chave ? [{ caminho: `cores.${indice}.${campo}`, campo, chave }] : [];
    }),
  );
  const existem = await Promise.all(imagens.map(({ chave }) => armazenamento.existe(chave)));

  const errors: Record<string, string> = {};
  imagens.forEach(({ caminho, campo }, indice) => {
    if (!existem[indice]) {
      errors[caminho] = MENSAGENS_DE_IMAGEM[campo];
    }
  });
  return errors;
}
