<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'

import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { atualizarMaterial, listarMateriais } from '@/api/materiais'
import BaseAreaTexto from '@/components/base/BaseAreaTexto.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseCarregando from '@/components/base/BaseCarregando.vue'
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import BaseModalFormulario from '@/components/base/BaseModalFormulario.vue'
import { useAvisos } from '@/stores/avisos'
import type { Material, TipoMaterial } from '@/types/material'
import { centavosParaDecimal, decimalParaCentavos } from '@/utils/formatacao'
import { aplicarErrosDaApi, schemaZod } from '@/utils/validacao'
import CartaoMaterial from './CartaoMaterial.vue'

const PRECO_INVALIDO = 'Informe um preço válido.'

const esquemaMaterial = z.object({
  precoPorM2: z.string({ error: PRECO_INVALIDO }).regex(/[1-9]/, { error: PRECO_INVALIDO }),
  descricao: z
    .string({ error: 'Informe a descrição.' })
    .trim()
    .min(1, { error: 'Informe a descrição.' })
    .max(300, { error: 'A descrição pode ter até 300 caracteres.' }),
  etiqueta: z
    .string({ error: 'Informe a etiqueta.' })
    .trim()
    .min(1, { error: 'Informe a etiqueta.' })
    .max(40, { error: 'A etiqueta pode ter até 40 caracteres.' }),
})

const nomes: Record<TipoMaterial, string> = { DTF: 'DTF', DTF_UV: 'DTF UV' }

const avisos = useAvisos()

const materiais = ref<Material[]>([])
const estado = ref<'carregando' | 'erro' | 'pronta'>('carregando')
let controlador: AbortController | undefined

async function carregar() {
  controlador?.abort()
  controlador = new AbortController()
  const { signal } = controlador
  if (estado.value !== 'pronta') estado.value = 'carregando'
  try {
    materiais.value = await listarMateriais(signal)
    estado.value = 'pronta'
  } catch {
    if (!signal.aborted) estado.value = 'erro'
  }
}

onMounted(carregar)
onBeforeUnmount(() => controlador?.abort())

const { handleSubmit, isSubmitting, resetForm, setErrors } = useForm({
  validationSchema: schemaZod(esquemaMaterial),
  initialValues: { precoPorM2: '', descricao: '', etiqueta: '' },
})

const formularioAberto = ref(false)
const emEdicao = ref<Material>()
const erroDoEnvio = ref<string>()
const tituloDoFormulario = computed(
  () => `Editar material ${emEdicao.value ? nomes[emEdicao.value.tipo] : ''}`,
)

function abrirFormulario(material: Material) {
  emEdicao.value = material
  erroDoEnvio.value = undefined
  resetForm({
    values: {
      precoPorM2: decimalParaCentavos(material.precoPorM2),
      descricao: material.descricao,
      etiqueta: material.etiqueta,
    },
  })
  formularioAberto.value = true
}

function tratarErroDoEnvio(erro: unknown) {
  if (aplicarErrosDaApi(erro, setErrors)) return
  if (erro instanceof ErroApi && erro.codigo === 'MATERIAL_NAO_ENCONTRADO') {
    formularioAberto.value = false
    avisos.erro(erro.mensagem)
    carregar()
    return
  }
  erroDoEnvio.value = MENSAGEM_GERAL
}

const enviar = handleSubmit(
  async ({ precoPorM2, descricao, etiqueta }) => {
    erroDoEnvio.value = undefined
    if (!emEdicao.value) return
    try {
      await atualizarMaterial(emEdicao.value.tipo, {
        precoPorM2: centavosParaDecimal(precoPorM2),
        descricao,
        etiqueta,
      })
    } catch (erro) {
      tratarErroDoEnvio(erro)
      return
    }
    formularioAberto.value = false
    avisos.sucesso('Material atualizado.')
    carregar()
  },
  () => {
    erroDoEnvio.value = undefined
  },
)
</script>

<template>
  <div class="flex flex-col gap-6.25">
    <p class="text-14 font-medium text-cinza-dtf">
      Preço por m², etiqueta e descrição que o cliente vê ao escolher o material da folha.
    </p>
    <div
      v-if="estado === 'carregando'"
      class="flex h-50 items-center justify-center rounded-padrao ring-1 ring-cinza-escuro/67 ring-inset"
    >
      <BaseCarregando />
    </div>
    <div v-else-if="estado === 'erro'" class="flex flex-col items-start gap-3.75">
      <BaseMensagem class="w-full">{{ MENSAGEM_GERAL }}</BaseMensagem>
      <BaseBotao variante="secundario" tamanho="compacto" class="w-35" @click="carregar">
        Tentar novamente
      </BaseBotao>
    </div>
    <BaseEstadoVazio v-else-if="materiais.length === 0" titulo="Nenhum material cadastrado." />
    <div v-else class="grid grid-cols-2 gap-6.25">
      <CartaoMaterial
        v-for="material in materiais"
        :key="material.tipo"
        :material="material"
        :nome="nomes[material.tipo]"
        @editar="abrirFormulario(material)"
      />
    </div>

    <BaseModalFormulario
      v-model:open="formularioAberto"
      :titulo="tituloDoFormulario"
      texto-confirmar="Salvar"
      :carregando="isSubmitting"
      :erro="erroDoEnvio"
      @enviar="enviar"
    >
      <BaseCampoTexto nome="precoPorM2" rotulo="Preço por m²" mascara="moeda" />
      <BaseAreaTexto nome="descricao" rotulo="Descrição" :linhas="5" :limite="300" />
      <BaseCampoTexto nome="etiqueta" rotulo="Etiqueta" :limite="40" />
    </BaseModalFormulario>
  </div>
</template>
