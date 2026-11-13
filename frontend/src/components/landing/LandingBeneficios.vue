<script setup lang="ts">
import camisaFlutuante from '@/assets/camisa-flutuante.png'

const beneficios = [
  {
    titulo: 'Impressão DTF',
    descricao: 'Alta definição na peça',
  },
  {
    titulo: 'Peça ou folha',
    descricao: 'Você escolhe o caminho',
  },
  {
    titulo: 'Pedidos online',
    descricao: 'Acompanhe cada etapa',
  },
  {
    titulo: 'Envio nacional',
    descricao: 'Para todo o Brasil',
  },
]
</script>

<template>
  <section class="border-y border-preto-dtf/10" aria-label="Diferenciais da NorDTF">
    <ul class="mx-auto grid w-full max-w-320 grid-cols-2 gap-px bg-preto-dtf/10 lg:grid-cols-4">
      <li
        v-for="(beneficio, indice) in beneficios"
        :key="beneficio.titulo"
        class="revelar flex items-center gap-3 bg-branco-dtf px-4 py-6 md:px-6"
        data-revelar
        :style="{ '--revelar-atraso': `${indice * 80}ms` }"
      >
        <img
          :src="camisaFlutuante"
          alt=""
          aria-hidden="true"
          class="size-7 shrink-0 object-contain"
        />
        <div>
          <p class="text-[11px] font-black uppercase leading-tight tracking-[0.12em]">
            {{ beneficio.titulo }}
          </p>
          <p class="mt-1 text-12 leading-tight text-cinza-dtf">{{ beneficio.descricao }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
