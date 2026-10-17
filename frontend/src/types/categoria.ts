export type Categoria = { id: string; nome: string }

export type CategoriaComUso = Categoria & { produtos: number; estampas: number }
