<script setup lang="ts">
import LandingBotaoLink from './LandingBotaoLink.vue'

const motivos = [
  {
    numero: '01',
    titulo: 'Sua ideia no centro',
    descricao: 'Estampas prontas ou arte própria: você escolhe o ponto de partida.',
  },
  {
    numero: '02',
    titulo: 'Sem complicação',
    descricao: 'Produtos, estampas e personalização reunidos em um só lugar.',
  },
  {
    numero: '03',
    titulo: 'Qualidade no detalhe',
    descricao: 'Impressão DTF pensada para manter cores e definição no dia a dia.',
  },
  {
    numero: '04',
    titulo: 'Pedidos à vista',
    descricao: 'Acompanhe o andamento de cada compra pela sua conta.',
  },
]
</script>

<template>
  <section class="bg-cinza-claro py-16 md:py-20 lg:py-24" aria-labelledby="titulo-sobre">
    <div class="mx-auto w-full max-w-320 px-5 md:px-7.5 lg:px-12.5">
      <div class="grid gap-10 lg:grid-cols-[0.85fr_1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div class="revelar" data-revelar>
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-cinza-dtf">
            Nova fase
          </span>
          <h2
            id="titulo-sobre"
            class="mt-3 font-destaque text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]"
          >
            Estampas com atitude.
          </h2>
          <p class="mt-5 max-w-sm text-16 leading-relaxed text-cinza-dtf">
            Peças que saem do óbvio. Escolha uma estampa pronta ou traga a sua arte e transforme a
            ideia em visual.
          </p>
          <LandingBotaoLink
            :para="{ name: 'loja-produtos' }"
            variante="escuro"
            tamanho="compacto"
            class="mt-6"
          >
            <span class="uppercase tracking-[0.1em]">Ver novidades</span>
            <span aria-hidden="true">→</span>
          </LandingBotaoLink>
        </div>

        <div
          class="revelar relative aspect-[4/5] overflow-hidden bg-preto-dtf"
          data-revelar
          :style="{ '--revelar-atraso': '100ms' }"
        >
          <div class="absolute inset-0 bg-[#161616]" aria-hidden="true">
            <span
              class="texto-contorno-claro absolute inset-0 grid place-items-center font-destaque text-[clamp(4rem,14vw,9rem)] font-black uppercase leading-none"
            >
              Drop
            </span>
          </div>

          <div
            class="absolute inset-0 bg-gradient-to-t from-preto-dtf/60 via-transparent to-transparent"
            aria-hidden="true"
          ></div>

          <span
            class="absolute bottom-4 left-4 bg-amarelo-dtf px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-preto-dtf"
          >
            Coleção em destaque
          </span>
        </div>

        <div class="revelar" data-revelar :style="{ '--revelar-atraso': '200ms' }">
          <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-cinza-dtf">
            Mesma essência.
          </p>
          <p
            class="mt-2 font-destaque text-24 font-black uppercase leading-[0.95] tracking-[-0.02em]"
          >
            Energias diferentes.
          </p>
          <p class="mt-4 text-14 leading-relaxed text-cinza-dtf">
            Do rascunho à peça final, cada projeto passa por escolha, conferência e impressão. Sem
            etapas escondidas.
          </p>
          <RouterLink
            :to="{ name: 'loja-estampas' }"
            class="mt-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] underline underline-offset-4 transition-opacity hover:opacity-60"
          >
            Explorar estampas
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>

      <div class="mt-14 grid gap-px bg-preto-dtf/10 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="(motivo, indice) in motivos"
          :key="motivo.numero"
          class="revelar flex min-h-40 flex-col justify-between bg-cinza-claro p-5"
          data-revelar
          :style="{ '--revelar-atraso': `${indice * 80}ms` }"
        >
          <span class="text-[11px] font-black text-cinza-dtf">{{ motivo.numero }}</span>
          <div class="mt-6">
            <h3 class="font-destaque text-18 font-black uppercase leading-[0.95]">
              {{ motivo.titulo }}
            </h3>
            <p class="mt-2 text-13 leading-snug text-cinza-dtf">{{ motivo.descricao }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
