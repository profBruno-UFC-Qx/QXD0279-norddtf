import { MaterialNaoEncontradoError } from '../../errors/MaterialNaoEncontradoError.js';
import type { MateriaisRepository } from '../../repositories/MateriaisRepository.js';
import type { DadosDoMaterial, TipoMaterial } from '../../schemas/materialSchemas.js';

export class AtualizarMaterialService {
  constructor(private readonly materiaisRepository: MateriaisRepository) {}

  async execute(tipo: TipoMaterial, dados: DadosDoMaterial) {
    const atualizado = await this.materiaisRepository.atualizar(tipo, dados);
    if (!atualizado) {
      throw new MaterialNaoEncontradoError();
    }
    return atualizado;
  }
}
