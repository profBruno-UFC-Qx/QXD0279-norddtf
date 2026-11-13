import type { Armazenamento } from '../../../../shared/infra/armazenamento/Armazenamento.js';
import { gerarChaveDeImagem, urlDaImagem } from '../../chaveDeImagem.js';
import { detectarTipoDeImagem } from '../../detectarTipoDeImagem.js';
import { ArquivoInvalidoError } from '../../errors/ArquivoInvalidoError.js';

export class EnviarImagemService {
  constructor(private readonly armazenamento: Armazenamento) {}

  async execute(conteudo: Buffer | undefined) {
    if (!conteudo) {
      throw new ArquivoInvalidoError();
    }

    const tipo = detectarTipoDeImagem(conteudo);
    if (!tipo) {
      throw new ArquivoInvalidoError();
    }

    const chave = gerarChaveDeImagem(tipo.extensao);
    await this.armazenamento.salvar(chave, conteudo, tipo.mime);

    return { chave, url: urlDaImagem(chave) };
  }
}
