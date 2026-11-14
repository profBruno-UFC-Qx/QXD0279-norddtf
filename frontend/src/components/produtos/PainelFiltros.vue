<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useForm } from 'vee-validate'
import { PopoverContent, PopoverRoot, PopoverTrigger } from 'reka-ui'

import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseEscolhaMultipla from '@/components/base/BaseEscolhaMultipla.vue'
import BaseFaixaPreco from '@/components/base/BaseFaixaPreco.vue'
import IconeFiltro from '@/components/icones/IconeFiltro.vue'
import type { Categoria } from '@/types/categoria'
import { TAMANHOS, type FaixaDePreco, type FiltrosProdutos, type Tamanho } from '@/types/produto'

type FiltrosDoPainel = Pick<FiltrosProdutos, 'categorias' | 'tamanhos' | 'precoMin' | 'precoMax'>

const props = defineProps<{
  aplicados: FiltrosProdutos
  categorias: Categoria[]
  faixaDePreco: FaixaDePreco | null
}>()

const emit = defineEmits<{ aplicar: [filtros: FiltrosDoPainel] }>()

const idTamanhos = `${useId()}-tamanhos`

const aberto = ref(false)
const tamanhos = ref<Tamanho[]>([])
const faixa = ref<[string, string]>(['0.00', '0.00'])

const { values, resetForm } = useForm({ initialValues: { categorias: [] as string[] } })

const opcoesDeCategoria = computed(() =>
  props.categorias.map((categoria) => ({ valor: categoria.id, rotulo: categoria.nome })),
)

function faixaInicial(limites: FaixaDePreco): [string, string] {
  return [props.aplicados.precoMin ?? limites.min, props.aplicados.precoMax ?? limites.max]
}

function preparar() {
  resetForm({ values: { categorias: [...props.aplicados.categorias] } })
  tamanhos.value = [...props.aplicados.tamanhos]
  if (props.faixaDePreco) faixa.value = faixaInicial(props.faixaDePreco)
}

watch(
  () => props.faixaDePreco,
  (limites, anteriores) => {
    if (aberto.value && limites && !anteriores) faixa.value = faixaInicial(limites)
  },
)

function mudarAberto(valor: boolean) {
  if (valor) preparar()
  aberto.value = valor
}

function alternarTamanho(tamanho: Tamanho) {
  const marcados = new Set(tamanhos.value)
  if (marcados.has(tamanho)) marcados.delete(tamanho)
  else marcados.add(tamanho)
  tamanhos.value = TAMANHOS.filter((opcao) => marcados.has(opcao))
}

function faixaEscolhida(limites: FaixaDePreco | null) {
  if (!limites) return { precoMin: undefined, precoMax: undefined }
  const [minimo, maximo] = faixa.value
  return {
    precoMin: Number(minimo) > Number(limites.min) ? minimo : undefined,
    precoMax: Number(maximo) < Number(limites.max) ? maximo : undefined,
  }
}

function aplicar() {
  emit('aplicar', {
    categorias: values.categorias ?? [],
    tamanhos: tamanhos.value,
    ...faixaEscolhida(props.faixaDePreco),
  })
  aberto.value = false
}
</script>

<template>
  <PopoverRoot :open="aberto" @update:open="mudarAberto">
    <PopoverTrigger as-child>
      <BaseBotao tamanho="acao">
        <IconeFiltro class="size-6" />
        Filtros
      </BaseBotao>
    </PopoverTrigger>
    <PopoverContent
      side="bottom"
      align="end"
      :side-offset="10"
      class="z-10 flex w-85 flex-col gap-5 rounded-padrao bg-branco-dtf p-5 text-preto-dtf ring-1 ring-cinza-escuro/67 ring-inset"
    >
      <h2 class="text-16 font-bold">Filtrar produtos</h2>
      <BaseEscolhaMultipla nome="categorias" rotulo="Categorias" :opcoes="opcoesDeCategoria" />
      <BaseFaixaPreco
        v-if="faixaDePreco"
        v-model="faixa"
        :min="faixaDePreco.min"
        :max="faixaDePreco.max"
      />
      <div role="group" :aria-labelledby="idTamanhos" class="flex flex-col gap-1.25">
        <span :id="idTamanhos" class="text-14 font-medium">Tamanhos</span>
        <div class="grid grid-cols-6 gap-1.25">
          <button
            v-for="tamanho in TAMANHOS"
            :key="tamanho"
            type="button"
            :aria-pressed="tamanhos.includes(tamanho)"
            class="h-7.5 rounded-padrao bg-branco-dtf text-13 font-bold text-preto-dtf ring-1 ring-cinza-escuro/67 ring-inset aria-pressed:bg-amarelo-dtf aria-pressed:ring-0"
            @click="alternarTamanho(tamanho)"
          >
            {{ tamanho }}
          </button>
        </div>
      </div>
      <div class="flex justify-end gap-2.5">
        <BaseBotao variante="secundario" tamanho="compacto" class="w-30" @click="aberto = false">
          Cancelar
        </BaseBotao>
        <BaseBotao tamanho="compacto" class="w-30" @click="aplicar">Aplicar filtro</BaseBotao>
      </div>
    </PopoverContent>
  </PopoverRoot>
</template>
