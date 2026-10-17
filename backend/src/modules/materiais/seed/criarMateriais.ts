import type { MateriaisRepository } from '../repositories/MateriaisRepository.js';
import type { TipoMaterial } from '../schemas/materialSchemas.js';

export type ResultadoDoMaterial = { tipo: TipoMaterial; situacao: 'criado' | 'mantido' };

const materiaisIniciais = [
  {
    tipo: 'DTF',
    precoPorM2: '67.00',
    etiqueta: 'Indicado para tecidos',
    descricao: 'Ideal para personalizar roupas e tecidos com estampas vibrantes, resistentes e cheias de detalhes. Perfeito para camisetas, uniformes, ecobags e muito mais, garantindo conforto e ótima durabilidade no dia a dia.',
  },
  {
    tipo: 'DTF_UV',
    precoPorM2: '80.00',
    etiqueta: 'Indicado para superfícies rígidas',
    descricao: 'Perfeito para personalizar superfícies rígidas com acabamento moderno e alta qualidade. Pode ser aplicado em copos, garrafas, acrílico, vidro, plástico, madeira etc, criando adesivos resistentes e com cores vivas.',
  },
] as const;

export async function criarMateriais(materiaisRepository: MateriaisRepository): Promise<ResultadoDoMaterial[]> {
  const resultados: ResultadoDoMaterial[] = [];
  for (const { tipo, ...dados } of materiaisIniciais) {
    if (await materiaisRepository.buscarPorTipo(tipo)) {
      resultados.push({ tipo, situacao: 'mantido' });
      continue;
    }

    await materiaisRepository.criar(tipo, dados);
    resultados.push({ tipo, situacao: 'criado' });
  }
  return resultados;
}
