<script setup lang="ts">
import { computed, useId } from 'vue'

import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseChave from '@/components/base/BaseChave.vue'
import IconeMais from '@/components/icones/IconeMais.vue'
import type { CorDoFormulario, LinhaDeEstoque } from './esquemaProduto'
import LinhaEstoque from './LinhaEstoque.vue'

const props = defineProps<{
  linhas: { chave: number | string; linha: LinhaDeEstoque }[]
  temTamanho: boolean
  cores: CorDoFormulario[]
  coresDoEstoque: CorDoFormulario[]
  erros: Partial<Record<string, string>>
  tentou: boolean
  travada: boolean
}>()

const emit = defineEmits<{
  adicionar: []
  mudarTamanho: [temTamanho: boolean]
  trocarCor: [indice: number, cor: string]
  mudarQuantidade: [indice: number, posicao: number, quantidade: number | null]
  remover: [indice: number]
}>()

const idTitulo = useId()

const semTamanho = computed({
  get: () => !props.temTamanho,
  set: (ligada: boolean) => emit('mudarTamanho', !ligada),
})

const coresComLinha = computed(() => new Set(props.linhas.map(({ linha }) => linha.cor)))

const podeAdicionar = computed(() =>
  props.coresDoEstoque.some((cor) => !coresComLinha.value.has(cor.idLocal)),
)

const errosDasCores = computed(() => {
  if (!props.tentou) return []
  return props.cores.flatMap((_, indice) => props.erros[`cores[${indice}].estoque`] ?? [])
})

function opcoesDa(linha: LinhaDeEstoque) {
  return props.coresDoEstoque.filter(
    (cor) => cor.idLocal === linha.cor || !coresComLinha.value.has(cor.idLocal),
  )
}

function invalidas(indice: number, linha: LinhaDeEstoque) {
  return linha.quantidades.map(
    (_, posicao) => props.tentou && !!props.erros[`estoque[${indice}].quantidades[${posicao}]`],
  )
}

function mensagemDa(indice: number, linha: LinhaDeEstoque) {
  if (!props.tentou) return undefined
  return linha.quantidades
    .map((_, posicao) => props.erros[`estoque[${indice}].quantidades[${posicao}]`])
    .find(Boolean)
}
</script>

<template>
  <section
    :aria-labelledby="idTitulo"
    class="flex flex-col gap-2.5 rounded-padrao px-3.75 py-7.5 ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <div class="flex items-center justify-between gap-5">
      <div class="flex flex-col gap-1.25">
        <h2 :id="idTitulo" class="text-24 font-medium">Tamanhos, cores e estoque</h2>
        <p class="text-12">Para cada cor, informe o estoque de cada tamanho.</p>
        <p v-for="erro in errosDasCores" :key="erro" class="text-12 text-erro">{{ erro }}</p>
      </div>
      <BaseChave
        v-model="semTamanho"
        rotulo="Produto sem tamanho"
        :desabilitado="travada"
        :mensagem="
          travada ? 'Este produto já foi vendido e não pode mudar a opção de tamanho.' : undefined
        "
      />
    </div>
    <LinhaEstoque
      v-for="({ chave, linha }, indice) in linhas"
      :key="chave"
      :linha="linha"
      :tem-tamanho="temTamanho"
      :opcoes="opcoesDa(linha)"
      :invalidas="invalidas(indice, linha)"
      :mensagem="mensagemDa(indice, linha)"
      @trocar-cor="emit('trocarCor', indice, $event)"
      @mudar-quantidade="
        (posicao, quantidade) => emit('mudarQuantidade', indice, posicao, quantidade)
      "
      @remover="emit('remover', indice)"
    />
    <BaseBotao
      variante="secundario"
      tamanho="compacto"
      class="self-start"
      :desabilitado="!podeAdicionar"
      @click="emit('adicionar')"
    >
      <IconeMais class="size-4" />
      Adicionar estoque de cor
    </BaseBotao>
  </section>
</template>
