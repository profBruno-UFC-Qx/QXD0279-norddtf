import { CategoriaNaoEncontradaError } from '../../errors/CategoriaNaoEncontradaError.js';
import type { CategoriasRepository } from '../../repositories/CategoriasRepository.js';

export class RemoverCategoriaService {
  constructor(private readonly categoriasRepository: CategoriasRepository) {}

  async execute(id: string) {
    if (!(await this.categoriasRepository.buscarPorId(id))) {
      throw new CategoriaNaoEncontradaError();
    }

    await this.categoriasRepository.remover(id);
  }
}
