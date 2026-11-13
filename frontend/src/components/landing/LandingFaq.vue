<script setup lang="ts">
const perguntas = [
  {
    numero: '01',
    pergunta: 'O que é impressão DTF?',
    resposta:
      'DTF (Direct to Film) é uma técnica que imprime a arte em um filme e transfere para o tecido com calor. O resultado tem alta definição e bom acabamento em diferentes tipos de peça.',
  },
  {
    numero: '02',
    pergunta: 'Posso usar minha própria arte?',
    resposta:
      'Sim. Você pode enviar um arquivo próprio em boa resolução. Antes de imprimir, conferimos formato e qualidade para evitar surpresas.',
  },
  {
    numero: '03',
    pergunta: 'Como faço um pedido?',
    resposta:
      'Escolha o produto, defina a arte e as opções de personalização e finalize pela sacola. Cada página de produto mostra o passo a passo.',
  },
  {
    numero: '04',
    pergunta: 'Preciso criar conta para comprar?',
    resposta:
      'Você pode explorar produtos e estampas sem conta. Para finalizar a compra e acompanhar pedidos, é preciso entrar ou se cadastrar.',
  },
  {
    numero: '05',
    pergunta: 'Como acompanho meu pedido?',
    resposta:
      'Entre na sua conta e abra a área de pedidos para ver o status atualizado de cada compra.',
  },
  {
    numero: '06',
    pergunta: 'A estampa resiste à lavagem?',
    resposta:
      'Seguindo as recomendações de cuidado, a impressão DTF mantém a definição por mais tempo. As orientações acompanham o pedido.',
  },
]
</script>

<template>
  <section
    id="duvidas"
    class="mx-auto grid w-full max-w-320 scroll-mt-24 gap-10 px-5 py-16 md:px-7.5 md:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:px-12.5 lg:py-24"
    aria-labelledby="titulo-faq"
  >
    <div class="revelar" data-revelar>
      <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-cinza-dtf">Dúvidas</span>
      <h2
        id="titulo-faq"
        class="mt-3 font-destaque text-[clamp(2.5rem,6vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.04em]"
      >
        Sem rodeio.
      </h2>
      <p class="mt-4 max-w-sm text-16 leading-relaxed text-cinza-dtf">
        As respostas para as perguntas que mais aparecem antes do primeiro pedido.
      </p>
    </div>

    <div class="border-t border-preto-dtf/15">
      <details
        v-for="(item, indice) in perguntas"
        :key="item.numero"
        class="revelar group border-b border-preto-dtf/15"
        data-revelar
        :style="{ '--revelar-atraso': `${indice * 60}ms` }"
      >
        <summary
          class="flex cursor-pointer list-none items-center gap-4 py-5 [&::-webkit-details-marker]:hidden"
        >
          <span class="text-[11px] font-black text-cinza-dtf">{{ item.numero }}</span>

          <span class="flex-1 text-16 font-bold md:text-18">{{ item.pergunta }}</span>

          <span
            class="relative size-6 shrink-0 rounded-full border border-preto-dtf/20 before:absolute before:left-1/2 before:top-1/2 before:h-px before:w-2.5 before:-translate-x-1/2 before:-translate-y-1/2 before:bg-preto-dtf after:absolute after:left-1/2 after:top-1/2 after:h-2.5 after:w-px after:-translate-x-1/2 after:-translate-y-1/2 after:bg-preto-dtf after:transition-transform after:duration-150 group-open:after:rotate-90"
            aria-hidden="true"
          ></span>
        </summary>

        <p class="max-w-xl pb-5 pl-8 text-14 leading-relaxed text-cinza-dtf md:text-16">
          {{ item.resposta }}
        </p>
      </details>
    </div>
  </section>
</template>
