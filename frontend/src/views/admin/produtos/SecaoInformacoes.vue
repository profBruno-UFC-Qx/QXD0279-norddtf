<script setup lang="ts">
import { computed, useId } from 'vue'

import BaseAreaTexto from '@/components/base/BaseAreaTexto.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseEscolhaMultipla from '@/components/base/BaseEscolhaMultipla.vue'
import type { Categoria } from '@/types/categoria'

const props = defineProps<{ categorias: Categoria[] }>()

const opcoes = computed(() =>
  props.categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome })),
)

const idTitulo = useId()
</script>

<template>
  <section
    :aria-labelledby="idTitulo"
    class="flex flex-col gap-2.5 rounded-padrao px-3.75 py-2.5 ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <h2 :id="idTitulo" class="text-24 font-medium">Informações básicas</h2>
    <div class="grid grid-cols-[259fr_230fr_349fr] items-start gap-x-10">
      <BaseCampoTexto
        nome="nome"
        rotulo="Nome do produto"
        :limite="120"
        placeholder="Insira o nome do produto"
      />
      <BaseCampoTexto
        nome="preco"
        rotulo="Preço"
        mascara="moeda"
        :digitos-da-moeda="7"
        placeholder="Insira o preço do produto"
      />
      <BaseEscolhaMultipla nome="categorias" rotulo="Categorias" :opcoes="opcoes" />
    </div>
    <BaseAreaTexto
      nome="descricao"
      rotulo="Descrição"
      :limite="2000"
      placeholder="Descreva aqui o seu produto"
      class="[&_textarea]:h-30"
    />
  </section>
</template>
