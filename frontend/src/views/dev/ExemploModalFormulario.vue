<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { z } from 'zod'

import BaseAreaTexto from '@/components/base/BaseAreaTexto.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseModalFormulario from '@/components/base/BaseModalFormulario.vue'
import { centavosParaDecimal } from '@/utils/formatacao'
import { schemaZod } from '@/utils/validacao'

const esquema = z.object({
  nome: z.string().trim().min(1, { error: 'Informe o nome.' }),
  preco: z.string().min(1, { error: 'Informe um preço válido.' }),
  descricao: z.string().trim().min(1, { error: 'Informe a descrição.' }),
})

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: schemaZod(esquema),
  initialValues: { nome: '', preco: '', descricao: '' },
})

const aberto = ref(false)
const lento = ref(false)
const valorEnviado = ref('')

function abrir(envioLento: boolean) {
  resetForm()
  lento.value = envioLento
  aberto.value = true
}

const enviar = handleSubmit(async (valores) => {
  if (lento.value) await new Promise((resolver) => setTimeout(resolver, 1000))
  valorEnviado.value = centavosParaDecimal(valores.preco)
  aberto.value = false
})
</script>

<template>
  <div class="flex flex-col items-start gap-5">
    <div class="flex flex-wrap items-center gap-5">
      <BaseBotao variante="secundario" tamanho="compacto" @click="abrir(false)">
        Abrir modal de formulário
      </BaseBotao>
      <BaseBotao variante="secundario" tamanho="compacto" @click="abrir(true)">
        Abrir modal com envio lento
      </BaseBotao>
    </div>
    <BaseModalFormulario
      v-model:open="aberto"
      titulo="Editar material DTF"
      texto-confirmar="Salvar"
      :carregando="isSubmitting"
      @enviar="enviar"
    >
      <BaseCampoTexto nome="nome" rotulo="Nome" :limite="40" placeholder="Ex.: Heróis" />
      <BaseCampoTexto nome="preco" rotulo="Preço por m²" mascara="moeda" />
      <BaseAreaTexto nome="descricao" rotulo="Descrição" :linhas="5" :limite="300" />
    </BaseModalFormulario>
    <p v-if="valorEnviado">Valor enviado: {{ valorEnviado }}</p>
  </div>
</template>
