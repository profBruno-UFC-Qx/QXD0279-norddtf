import { normalizarNome } from '../../normalizarNome.js';
import { CategoriaJaCadastradaError } from '../../errors/CategoriaJaCadastradaError.js';
import type { CategoriasRepository } from '../../repositories/CategoriasRepository.js';

interface CriarCategoriaInput {
  nome: string;
}

export class CriarCategoriaService {
  constructor(private readonly categoriasRepository: CategoriasRepository) {}

  async execute({ nome }: CriarCategoriaInput) {
    const nomeNormalizado = normalizarNome(nome);
    if (await this.categoriasRepository.buscarPorNomeNormalizado(nomeNormalizado)) {
      throw new CategoriaJaCadastradaError();
    }

    return this.categoriasRepository.criar({ nome, nomeNormalizado });
  }
}
