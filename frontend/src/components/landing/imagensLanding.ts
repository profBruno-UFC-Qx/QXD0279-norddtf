const arquivos = import.meta.glob('../../assets/landing/*.{avif,jpeg,jpg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const porNome = new Map<string, string>()

for (const [caminho, url] of Object.entries(arquivos)) {
  const nome = caminho
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '')

  if (nome) porNome.set(nome, url)
}

/**
 * Devolve a URL da imagem colocada em `src/assets/landing` com o nome informado.
 * Retorna `null` quando a imagem ainda não existe, permitindo que o componente
 * use um fundo alternativo.
 */
export function imagemLanding(nome: string): string | null {
  return porNome.get(nome) ?? null
}
