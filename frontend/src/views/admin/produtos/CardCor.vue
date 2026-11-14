<script setup lang="ts">
import { computed } from 'vue'

import { URL_API } from '@/api/http'
import BaseAmostraCor from '@/components/base/BaseAmostraCor.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseQuadroImagem from '@/components/base/BaseQuadroImagem.vue'
import IconeEditar from '@/components/icones/IconeEditar.vue'
import IconeLixeira from '@/components/icones/IconeLixeira.vue'
import type { CampoDeImagem, TipoProduto } from '@/types/produto'
import { CAMPOS_DE_IMAGEM, IMAGENS_POR_TIPO, type CorDoFormulario } from './esquemaProduto'
import type { EnvioDeImagem } from './useEnvioDeImagem'

export type ModoDaCor = 'nova' | 'edicao' | 'salva'

const props = defineProps<{
  cor: CorDoFormulario
  indice: number
  tipo: TipoProduto
  modo: ModoDaCor
  titulo: string
  erros: Partial<Record<string, string>>
  mostrarErros: boolean
  enviando: boolean
  envioDe: (campo: CampoDeImagem) => EnvioDeImagem | undefined
  aviso?: string
}>()

const emit = defineEmits<{
  salvar: []
  descartar: []
  editar: []
  remover: []
  escolher: [campo: CampoDeImagem, arquivo: File]
}>()

const emEdicao = computed(() => props.modo !== 'salva')

function caminho(campo: string) {
  return `cores[${props.indice}].${campo}`
}

function erroDe(campo: string) {
  if (!props.mostrarErros) return undefined
  return props.erros[caminho(campo)]
}

const quadros = computed(() =>
  IMAGENS_POR_TIPO[props.tipo].map(({ campo, rotulo }) => {
    const envio = props.envioDe(campo)
    const imagem = props.cor[campo]
    const url = imagem ? URL_API + imagem.url : undefined
    const mensagem = envio?.estado === 'erro' ? envio.mensagem : erroDe(campo)
    return { campo, rotulo, url, mensagem, estado: estadoDoQuadro(envio, url, mensagem) }
  }),
)

function estadoDoQuadro(
  envio: EnvioDeImagem | undefined,
  url: string | undefined,
  mensagem?: string,
): 'vazio' | 'enviando' | 'enviado' | 'erro' {
  if (envio?.estado === 'enviando') return 'enviando'
  if (mensagem) return 'erro'
  return url ? 'enviado' : 'vazio'
}

const mensagens = computed(() => {
  const daCor = emEdicao.value ? [] : (['id', 'nome', 'hex'] as const)
  const foraDoTipo = CAMPOS_DE_IMAGEM.filter(
    (campo) => !quadros.value.some((quadro) => quadro.campo === campo),
  )
  return [
    ...daCor.map((campo) => ({ campo, texto: erroDe(campo) })),
    ...quadros.value.map(({ campo, mensagem }) => ({ campo, texto: mensagem })),
    ...foraDoTipo.map((campo) => ({ campo, texto: erroDe(campo) })),
  ].flatMap(({ campo, texto }) => (texto ? [{ campo, texto }] : []))
})

function salvarPeloTeclado(evento: KeyboardEvent) {
  if (!emEdicao.value || !(evento.target instanceof HTMLInputElement)) return
  evento.preventDefault()
  if (!props.enviando) emit('salvar')
}

const amostra = computed(() =>
  /^#[0-9A-F]{6}$/i.test(props.cor.hex) ? props.cor.hex : 'var(--color-branco-dtf)',
)
</script>

<template>
  <li
    class="flex w-73.25 flex-col gap-2.5 rounded-padrao p-2.5 ring-1 ring-inset"
    :class="emEdicao ? 'ring-cinza-escuro/67' : 'ring-cinza-claro'"
    @keydown.enter="salvarPeloTeclado"
  >
    <div class="flex h-6 items-center justify-between gap-2.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          class="size-6 shrink-0 rounded-full ring-1 ring-cinza-escuro/67 ring-inset"
          :style="{ backgroundColor: amostra }"
        />
        <h3 class="truncate text-16 font-medium">{{ titulo }}</h3>
      </div>
      <div v-if="emEdicao" class="flex shrink-0 items-center gap-3">
        <button
          type="button"
          class="grid size-6 place-items-center text-erro"
          :aria-label="
            modo === 'nova' ? 'Descartar a cor nova' : `Descartar as alterações de ${titulo}`
          "
          @click="emit('descartar')"
        >
          <IconeLixeira class="size-4" />
        </button>
        <BaseBotao
          tamanho="compacto"
          class="w-17.5"
          :desabilitado="enviando"
          @click="emit('salvar')"
        >
          Salvar
        </BaseBotao>
      </div>
      <div v-else class="flex shrink-0 items-center gap-3">
        <button
          type="button"
          class="grid size-6 place-items-center"
          :aria-label="`Editar a cor ${cor.nome}`"
          @click="emit('editar')"
        >
          <IconeEditar class="size-4" />
        </button>
        <button
          type="button"
          class="grid size-6 place-items-center text-erro"
          :aria-label="`Remover a cor ${cor.nome}`"
          @click="emit('remover')"
        >
          <IconeLixeira class="size-4" />
        </button>
      </div>
    </div>
    <p v-if="aviso" class="text-12 text-erro">{{ aviso }}</p>
    <template v-if="emEdicao">
      <BaseCampoTexto
        :nome="caminho('nome')"
        rotulo="Nome da cor"
        :limite="30"
        placeholder="Ex.: Preto"
      />
      <BaseAmostraCor :nome="caminho('hex')" rotulo="Cor da amostra" />
    </template>
    <div class="flex justify-between gap-1.25">
      <template v-if="emEdicao">
        <BaseQuadroImagem
          v-for="quadro in quadros"
          :key="quadro.campo"
          :rotulo="quadro.rotulo"
          :estado="quadro.estado"
          :url="quadro.url"
          :mensagem="quadro.mensagem"
          @escolher="emit('escolher', quadro.campo, $event)"
        />
      </template>
      <template v-else>
        <figure
          v-for="quadro in quadros"
          :key="quadro.campo"
          class="flex w-21 flex-col items-center justify-between gap-1.25"
        >
          <figcaption class="min-h-7.5 text-center text-12 font-medium">
            {{ quadro.rotulo }}
          </figcaption>
          <div
            class="grid h-20.5 w-16.5 place-items-center rounded-padrao p-1 ring-inset"
            :class="quadro.mensagem ? 'ring-2 ring-erro' : 'ring-1 ring-cinza-claro'"
          >
            <img
              v-if="quadro.url"
              :src="quadro.url"
              :alt="`${quadro.rotulo} da cor ${cor.nome}`"
              class="max-h-18.5 max-w-14.5 object-contain"
            />
          </div>
        </figure>
      </template>
    </div>
    <ul v-if="mensagens.length" class="flex flex-col text-12 text-erro">
      <li v-for="mensagem in mensagens" :key="mensagem.campo">{{ mensagem.texto }}</li>
    </ul>
  </li>
</template>
