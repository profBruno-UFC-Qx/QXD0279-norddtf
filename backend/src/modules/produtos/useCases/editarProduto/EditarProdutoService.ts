import type { Armazenamento } from '../../../../shared/infra/armazenamento/Armazenamento.js';
import { validar } from '../../../../shared/infra/http/validar.js';
import { conferirReferencias } from '../../conferirReferencias.js';
import { CorVendidaError } from '../../errors/CorVendidaError.js';
import { DadosDoProdutoInvalidosError } from '../../errors/DadosDoProdutoInvalidosError.js';
import { OpcaoDeTamanhoBloqueadaError } from '../../errors/OpcaoDeTamanhoBloqueadaError.js';
import { ProdutoNaoEncontradoError } from '../../errors/ProdutoNaoEncontradoError.js';
import { montarDetalhe } from '../../montarDetalhe.js';
import type { EstadoDaEdicao, MudancasDaEdicao, ProdutosRepository } from '../../repositories/ProdutosRepository.js';
import { COR_NAO_ENCONTRADA, edicaoDoProdutoSchema, type DadosDaEdicao } from '../../schemas/produtoSchemas.js';

export class EditarProdutoService {
  constructor(
    private readonly produtosRepository: ProdutosRepository,
    private readonly armazenamento: Armazenamento,
  ) {}

  async execute(id: string, corpo: unknown) {
    const atual = await this.produtosRepository.detalhar(id);
    if (!atual) {
      throw new ProdutoNaoEncontradoError();
    }

    const dados = validar(edicaoDoProdutoSchema(atual.tipo), corpo);
    const errors = {
      ...conferirIdsDasCores(atual.cores, dados.cores),
      ...(await conferirReferencias(this.produtosRepository, this.armazenamento, dados)),
    };
    if (Object.keys(errors).length > 0) {
      throw new DadosDoProdutoInvalidosError(errors);
    }

    await this.produtosRepository.atualizar(id, dados, (estado) => planejarEdicao(estado, dados));

    const produto = await this.produtosRepository.detalhar(id);
    if (!produto) {
      throw new ProdutoNaoEncontradoError();
    }
    return montarDetalhe(produto);
  }
}

function planejarEdicao(estado: EstadoDaEdicao, dados: DadosDaEdicao): MudancasDaEdicao {
  const errors = conferirIdsDasCores(estado.cores, dados.cores);
  if (Object.keys(errors).length > 0) {
    throw new DadosDoProdutoInvalidosError(errors);
  }

  const idsQueContinuam = new Set(dados.cores.map((cor) => cor.id));
  const coresRemovidas = estado.cores.filter((cor) => !idsQueContinuam.has(cor.id));
  const trocarVariantes = dados.temTamanho !== estado.temTamanho;
  if (trocarVariantes && estado.coresVendidas.size > 0) {
    throw new OpcaoDeTamanhoBloqueadaError();
  }
  const vendida = coresRemovidas.find((cor) => estado.coresVendidas.has(cor.id));
  if (vendida) {
    throw new CorVendidaError(vendida.nome);
  }
  return { coresRemovidas: coresRemovidas.map((cor) => cor.id), trocarVariantes };
}

function conferirIdsDasCores(gravadas: EstadoDaEdicao['cores'], cores: DadosDaEdicao['cores']) {
  const doProduto = new Set(gravadas.map((cor) => cor.id));
  const usados = new Set<string>();
  const errors: Record<string, string> = {};
  cores.forEach(({ id }, indice) => {
    if (id === undefined) {
      return;
    }
    if (!doProduto.has(id) || usados.has(id)) {
      errors[`cores.${indice}.id`] = COR_NAO_ENCONTRADA;
    }
    usados.add(id);
  });
  return errors;
}
