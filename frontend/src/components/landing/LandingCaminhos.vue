<script setup lang="ts">
import { imagemLanding } from './imagensLanding'

const caminhos = [
  {
    numero: '01',
    titulo: 'Estampas',
    descricao: 'Artes prontas para aplicar na peça que você quiser.',
    acao: 'Ver estampas',
    destino: { name: 'loja-estampas' },
    imagem: imagemLanding('categoria-estampas'),
    fundo: 'bg-[#171717]',
  },
  {
    numero: '02',
    titulo: 'Personalize',
    descricao: 'Escolha o produto e monte a combinação do seu jeito.',
    acao: 'Ver produtos',
    destino: { name: 'loja-produtos' },
    imagem: imagemLanding('categoria-personalize'),
    fundo: 'bg-[#241d0b]',
  },
  {
    numero: '03',
    titulo: 'Sua arte',
    descricao: 'Use uma criação própria e prepare o arquivo para impressão.',
    acao: 'Começar projeto',
    destino: { name: 'loja-produtos' },
    imagem: imagemLanding('categoria-arte'),
    fundo: 'bg-[#111111]',
  },
  {
    numero: '04',
    titulo: 'Pedidos',
    descricao: 'Crie sua conta e acompanhe cada etapa da compra.',
    acao: 'Criar conta',
    destino: { name: 'cadastro' },
    imagem: imagemLanding('categoria-pedidos'),
    fundo: 'bg-[#1c1508]',
  },
]
</script>

<template>
  <section
    id="produtos"
    class="scroll-mt-24 bg-branco-dtf py-16 md:py-20 lg:py-24"
    aria-labelledby="titulo-caminhos"
  >
    <div class="mx-auto w-full max-w-320 px-5 md:px-7.5 lg:px-12.5">
      <div class="flex items-end justify-between gap-6">
        <div class="revelar" data-revelar>
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-cinza-dtf">
            Explore a NorDTF
          </span>
          <h2
            id="titulo-caminhos"
            class="mt-3 font-destaque text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]"
          >
            Escolha seu lado.
          </h2>
        </div>

        <RouterLink
          :to="{ name: 'loja-produtos' }"
          class="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] transition-opacity hover:opacity-60 sm:flex"
        >
          Ver tudo
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>

      <div class="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RouterLink
          v-for="(caminho, indice) in caminhos"
          :key="caminho.numero"
          :to="caminho.destino"
          class="revelar group relative block aspect-[4/5] overflow-hidden bg-preto-dtf text-branco-dtf"
          data-revelar
          :style="{ '--revelar-atraso': `${indice * 90}ms` }"
        >
          <div
            v-if="caminho.imagem"
            class="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            :style="{ backgroundImage: `url(${caminho.imagem})` }"
            aria-hidden="true"
          ></div>

          <div
            v-else
            class="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            :class="caminho.fundo"
            aria-hidden="true"
          >
            <span
              class="texto-contorno-claro absolute inset-0 grid place-items-center font-destaque text-[clamp(4rem,12vw,8rem)] font-black leading-none"
            >
              {{ caminho.numero }}
            </span>
          </div>

          <div
            class="absolute inset-0 bg-gradient-to-t from-preto-dtf via-preto-dtf/35 to-transparent"
            aria-hidden="true"
          ></div>

          <span
            class="absolute left-4 top-4 inline-flex h-7 items-center bg-amarelo-dtf px-2 text-[10px] font-black uppercase tracking-[0.12em] text-preto-dtf"
          >
            {{ caminho.numero }}
          </span>

          <div class="absolute inset-x-4 bottom-4">
            <h3
              class="font-destaque text-24 font-black uppercase leading-[0.9] tracking-[-0.02em] md:text-32"
            >
              {{ caminho.titulo }}
            </h3>
            <p class="mt-2 max-w-[92%] text-12 leading-snug text-branco-dtf/70">
              {{ caminho.descricao }}
            </p>
            <span
              class="mt-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]"
            >
              {{ caminho.acao }}
              <span
                aria-hidden="true"
                class="transition-transform duration-150 group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
