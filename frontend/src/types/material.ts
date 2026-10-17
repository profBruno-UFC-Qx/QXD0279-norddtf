export type TipoMaterial = 'DTF' | 'DTF_UV'

export type Material = {
  tipo: TipoMaterial
  precoPorM2: string
  descricao: string
  etiqueta: string
  larguraFolhaCm: string
}

export type DadosDoMaterial = Pick<Material, 'precoPorM2' | 'descricao' | 'etiqueta'>
