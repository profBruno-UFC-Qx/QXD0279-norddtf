<script setup lang="ts">
import { useId } from 'vue'

import IconeMais from '@/components/icones/IconeMais.vue'
import type { CampoDeImagem, TipoProduto } from '@/types/produto'
import CardCor, { type ModoDaCor } from './CardCor.vue'
import type { CorDoFormulario } from './esquemaProduto'
import type { EnvioDeImagem } from './useEnvioDeImagem'

defineProps<{
  cores: CorDoFormulario[]
  tipo: TipoProduto
  erros: Partial<Record<string, string>>
  tentou: boolean
  podeAdicionar: boolean
  modoDe: (cor: CorDoFormulario) => ModoDaCor
  tituloDe: (cor: CorDoFormulario) => string
  mostrarErrosDe: (cor: CorDoFormulario) => boolean
  enviandoNaCor: (cor: CorDoFormulario) => boolean
  envioDe: (cor: CorDoFormulario, campo: CampoDeImagem) => EnvioDeImagem | undefined
}>()

const emit = defineEmits<{
  adicionar: []
  salvar: [cor: string]
  descartar: [cor: string]
  editar: [cor: string]
  remover: [cor: string]
  escolher: [cor: string, campo: CampoDeImagem, arquivo: File]
}>()

const idTitulo = useId()
</script>

<template>
  <section
    :aria-labelledby="idTitulo"
    class="flex flex-col gap-2.5 rounded-padrao px-3.75 py-2.5 ring-1 ring-cinza-escuro/67 ring-inset"
  >
    <div class="flex flex-col gap-1.25">
      <h2 :id="idTitulo" class="text-24 font-medium">Cores disponíveis</h2>
      <p v-if="tentou && erros.cores" class="text-12 text-erro">{{ erros.cores }}</p>
    </div>
    <ul class="grid grid-cols-[repeat(auto-fill,293px)] items-start gap-5">
      <CardCor
        v-for="(cor, indice) in cores"
        :key="cor.idLocal"
        :cor="cor"
        :indice="indice"
        :tipo="tipo"
        :modo="modoDe(cor)"
        :titulo="tituloDe(cor)"
        :erros="erros"
        :mostrar-erros="mostrarErrosDe(cor)"
        :enviando="enviandoNaCor(cor)"
        :envio-de="(campo) => envioDe(cor, campo)"
        @salvar="emit('salvar', cor.idLocal)"
        @descartar="emit('descartar', cor.idLocal)"
        @editar="emit('editar', cor.idLocal)"
        @remover="emit('remover', cor.idLocal)"
        @escolher="(campo, arquivo) => emit('escolher', cor.idLocal, campo, arquivo)"
      />
      <li v-if="podeAdicionar" class="grid self-center justify-self-center">
        <button
          type="button"
          aria-label="Adicionar cor"
          class="grid size-7.5 place-items-center rounded-padrao bg-branco-dtf ring-1 ring-cinza-escuro/67 ring-inset"
          @click="emit('adicionar')"
        >
          <IconeMais class="size-3.5" />
        </button>
      </li>
    </ul>
  </section>
</template>
