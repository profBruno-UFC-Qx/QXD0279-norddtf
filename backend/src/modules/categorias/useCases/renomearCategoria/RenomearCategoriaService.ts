import { normalizarNome } from '../../normalizarNome.js';
import { CategoriaJaCadastradaError } from '../../errors/CategoriaJaCadastradaError.js';
import { CategoriaNaoEncontradaError } from '../../errors/CategoriaNaoEncontradaError.js';
import type { CategoriasRepository } from '../../repositories/CategoriasRepository.js';

interface RenomearCategoriaInput {
  nome: string;
}

export class RenomearCategoriaService {
  constructor(private readonly categoriasRepository: CategoriasRepository) {}

  async execute(id: string, { nome }: RenomearCategoriaInput) {
    if (!(await this.categoriasRepository.buscarPorId(id))) {
      throw new CategoriaNaoEncontradaError();
    }

    const nomeNormalizado = normalizarNome(nome);
    const existente = await this.categoriasRepository.buscarPorNomeNormalizado(nomeNormalizado);
    if (existente && existente.id !== id) {
      throw new CategoriaJaCadastradaError();
    }

    const renomeada = await this.categoriasRepository.renomear(id, { nome, nomeNormalizado });
    if (!renomeada) {
      throw new CategoriaNaoEncontradaError();
    }
    return renomeada;
  }
}
