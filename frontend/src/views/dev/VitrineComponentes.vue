<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import { Form, useForm } from 'vee-validate'
import { z } from 'zod'

import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import { api } from '@/api/http'
import BaseAreaTexto from '@/components/base/BaseAreaTexto.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCaixaSelecao from '@/components/base/BaseCaixaSelecao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseCarregando from '@/components/base/BaseCarregando.vue'
import BaseEstadoVazio from '@/components/base/BaseEstadoVazio.vue'
import BaseModalConfirmacao from '@/components/base/BaseModalConfirmacao.vue'
import BaseSelecao from '@/components/base/BaseSelecao.vue'
import BaseTrilha from '@/components/base/BaseTrilha.vue'
import IconeSenha from '@/components/icones/IconeSenha.vue'
import IconeSms from '@/components/icones/IconeSms.vue'
import { useAvisos } from '@/stores/avisos'
import {
  formatarCep,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarTelefone,
} from '@/utils/formatacao'
import { mascararCep, mascararTelefone } from '@/utils/mascaras'
import { aplicarErrosDaApi, schemaZod } from '@/utils/validacao'

const statusDoBackend = ref('Consultando o backend…')

onMounted(async () => {
  try {
    const resposta = await api.get<{ status: string }>('/health')
    statusDoBackend.value = resposta.status
  } catch {
    statusDoBackend.value = MENSAGEM_GERAL
  }
})

const variantes = [
  { variante: 'primario', rotulo: 'Primário' },
  { variante: 'secundario', rotulo: 'Secundário' },
  { variante: 'risco', rotulo: 'Risco' },
] as const

const opcoes = [
  { valor: 'camisa', rotulo: 'Camisa' },
  { valor: 'material', rotulo: 'Material DTF' },
]

const formularioDeEstados = useTemplateRef<InstanceType<typeof Form>>('formularioDeEstados')

const errosForcados = {
  comErro: 'Informe um e-mail válido.',
  selecaoComErro: 'Escolha uma categoria.',
  areaComErro: 'Informe a descrição.',
  caixaComErro: 'Aceite os termos para continuar.',
}

const esquemaDosEstados = schemaZod(
  z.object({
    comErro: z.never({ error: errosForcados.comErro }),
    selecaoComErro: z.never({ error: errosForcados.selecaoComErro }),
    areaComErro: z.never({ error: errosForcados.areaComErro }),
    caixaComErro: z.never({ error: errosForcados.caixaComErro }),
  }),
)

onMounted(() => {
  formularioDeEstados.value?.setErrors(errosForcados)
})

const MENSAGEM_TELEFONE = 'Informe um telefone com DDD e 11 dígitos.'

const esquemaDoExemplo = z.object({
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(1, { error: 'Informe o nome.' })
    .max(120, { error: 'O nome pode ter até 120 caracteres.' }),
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .max(254, { error: 'O e-mail pode ter até 254 caracteres.' })
    .pipe(z.email({ error: 'Informe um e-mail válido.' })),
  telefone: z.string({ error: MENSAGEM_TELEFONE }).length(11, { error: MENSAGEM_TELEFONE }),
})

const { handleSubmit, isSubmitting, setErrors } = useForm({
  validationSchema: schemaZod(esquemaDoExemplo),
  initialValues: { nome: '', email: '', telefone: '' },
})

const mensagemDoEnvio = ref('')

const enviar = handleSubmit(
  async (valores) => {
    mensagemDoEnvio.value = ''
    try {
      await api.post('/dev/formulario-exemplo', valores)
    } catch (erro) {
      if (aplicarErrosDaApi(erro, setErrors)) return
      mensagemDoEnvio.value = erro instanceof ErroApi ? erro.mensagem : MENSAGEM_GERAL
    }
  },
  () => {
    mensagemDoEnvio.value = ''
  },
)

const exemplosDeFormatacao = [
  { chamada: 'formatarMoeda("1234.5")', resultado: formatarMoeda('1234.5') },
  { chamada: 'formatarMoeda("0.005")', resultado: formatarMoeda('0.005') },
  { chamada: 'formatarMoeda(0)', resultado: formatarMoeda(0) },
  {
    chamada: 'formatarData("2026-10-05T01:30:00Z")',
    resultado: formatarData('2026-10-05T01:30:00Z'),
  },
  {
    chamada: 'formatarDataHora("2026-10-05T01:30:00Z")',
    resultado: formatarDataHora('2026-10-05T01:30:00Z'),
  },
  { chamada: 'formatarTelefone("88998105897")', resultado: formatarTelefone('88998105897') },
  { chamada: 'formatarTelefone("8834123456")', resultado: formatarTelefone('8834123456') },
  { chamada: 'formatarTelefone("123")', resultado: formatarTelefone('123') },
  { chamada: 'formatarCep("63900000")', resultado: formatarCep('63900000') },
  { chamada: 'mascararTelefone("889981")', resultado: mascararTelefone('889981') },
  {
    chamada: 'mascararTelefone("889981058971234")',
    resultado: mascararTelefone('889981058971234'),
  },
  { chamada: 'mascararCep("639000001")', resultado: mascararCep('639000001') },
]

const modalAberto = ref(false)
const confirmado = ref(false)

function confirmarModal() {
  modalAberto.value = false
  confirmado.value = true
}

const modalDeRequisicaoAberto = ref(false)
const requisitando = ref(false)
const resultadoDaRequisicao = ref('')

async function confirmarRequisicao() {
  requisitando.value = true
  try {
    await api.get('/health')
    resultadoDaRequisicao.value = 'Requisição concluída'
  } catch {
    resultadoDaRequisicao.value = MENSAGEM_GERAL
  } finally {
    requisitando.value = false
    modalDeRequisicaoAberto.value = false
  }
}

const avisos = useAvisos()

const areaCarregando = ref(false)

const itensDaTrilha = [{ rotulo: 'Início', para: '/' }, { rotulo: 'Componentes' }]
</script>

<template>
  <main class="flex flex-col gap-12.5 p-12.5">
    <h1 class="text-32 font-bold">Vitrine de componentes</h1>

    <section aria-labelledby="titulo-status" class="flex flex-col gap-5">
      <h2 id="titulo-status" class="text-24 font-semibold">Status do backend</h2>
      <p>{{ statusDoBackend }}</p>
    </section>

    <section aria-labelledby="titulo-botoes" class="flex flex-col gap-5">
      <h2 id="titulo-botoes" class="text-24 font-semibold">Botões</h2>
      <div v-for="item in variantes" :key="item.variante" class="flex flex-wrap items-center gap-5">
        <BaseBotao :variante="item.variante">{{ item.rotulo }}</BaseBotao>
        <BaseBotao :variante="item.variante" desabilitado>{{ item.rotulo }} desabilitado</BaseBotao>
        <BaseBotao :variante="item.variante" carregando>{{ item.rotulo }} carregando</BaseBotao>
      </div>
    </section>

    <section aria-labelledby="titulo-campos" class="flex flex-col gap-5">
      <h2 id="titulo-campos" class="text-24 font-semibold">Campos</h2>
      <Form
        ref="formularioDeEstados"
        :validation-schema="esquemaDosEstados"
        :initial-values="{
          desabilitado: 'Valor fixo',
          selecaoDesabilitada: 'camisa',
          areaDesabilitada: 'Texto fixo',
          caixaDesabilitada: true,
        }"
        class="flex w-100.25 flex-col gap-5"
      >
        <BaseCampoTexto nome="texto" rotulo="Texto simples" placeholder="Digite um texto" />
        <BaseCampoTexto
          nome="email"
          rotulo="E-mail"
          tipo="email"
          :icone="IconeSms"
          placeholder="Insira seu email"
          autocomplete="email"
        />
        <BaseCampoTexto
          nome="senha"
          rotulo="Senha"
          tipo="password"
          :icone="IconeSenha"
          placeholder="Insira sua senha"
          autocomplete="current-password"
        />
        <BaseCampoTexto nome="telefone" rotulo="Telefone" tipo="tel" mascara="telefone" />
        <BaseCampoTexto nome="cep" rotulo="CEP" mascara="cep" />
        <BaseCampoTexto nome="comErro" rotulo="Com erro" tipo="email" :icone="IconeSms" />
        <BaseCampoTexto nome="desabilitado" rotulo="Desabilitado" desabilitado />
        <BaseSelecao nome="selecao" rotulo="Seleção" :opcoes="opcoes" placeholder="Escolha" />
        <BaseSelecao
          nome="selecaoComErro"
          rotulo="Seleção com erro"
          :opcoes="opcoes"
          placeholder="Escolha"
        />
        <BaseSelecao
          nome="selecaoDesabilitada"
          rotulo="Seleção desabilitada"
          :opcoes="opcoes"
          desabilitado
        />
        <BaseAreaTexto nome="area" rotulo="Área de texto" placeholder="Escreva aqui" />
        <BaseAreaTexto nome="areaComErro" rotulo="Área de texto com erro" />
        <BaseAreaTexto nome="areaDesabilitada" rotulo="Área de texto desabilitada" desabilitado />
        <BaseCaixaSelecao nome="caixa" rotulo="Caixa de seleção" />
        <BaseCaixaSelecao nome="caixaComErro" rotulo="Caixa de seleção com erro" />
        <BaseCaixaSelecao
          nome="caixaDesabilitada"
          rotulo="Caixa de seleção desabilitada"
          desabilitado
        />
      </Form>
    </section>

    <section aria-labelledby="titulo-exemplo" class="flex flex-col gap-5">
      <h2 id="titulo-exemplo" class="text-24 font-semibold">Formulário de exemplo</h2>
      <form class="flex w-100.25 flex-col gap-5" novalidate @submit="enviar">
        <BaseCampoTexto nome="nome" rotulo="Nome" autocomplete="name" />
        <BaseCampoTexto
          nome="email"
          rotulo="E-mail"
          tipo="email"
          :icone="IconeSms"
          autocomplete="email"
        />
        <BaseCampoTexto
          nome="telefone"
          rotulo="Telefone"
          tipo="tel"
          mascara="telefone"
          autocomplete="tel"
        />
        <p v-if="mensagemDoEnvio" role="alert" class="text-14 text-erro">{{ mensagemDoEnvio }}</p>
        <BaseBotao tipo="submit" :carregando="isSubmitting" class="w-full">Enviar</BaseBotao>
      </form>
    </section>

    <section aria-labelledby="titulo-formatacao" class="flex flex-col gap-5">
      <h2 id="titulo-formatacao" class="text-24 font-semibold">Formatação</h2>
      <table class="w-fit text-14">
        <thead>
          <tr>
            <th scope="col" class="py-1.25 pr-5 text-left font-semibold">Chamada</th>
            <th scope="col" class="py-1.25 text-left font-semibold">Resultado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exemplo in exemplosDeFormatacao" :key="exemplo.chamada">
            <td class="py-1.25 pr-5 font-mono">{{ exemplo.chamada }}</td>
            <td class="py-1.25">{{ exemplo.resultado }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section aria-labelledby="titulo-modal" class="flex flex-col gap-5">
      <h2 id="titulo-modal" class="text-24 font-semibold">Modal</h2>
      <div class="flex flex-wrap items-center gap-5">
        <BaseModalConfirmacao
          v-model:open="modalAberto"
          titulo="Tem certeza que deseja cancelar esse pedido?"
          descricao="Ao cancelar esse pedido, não será possível realizar nenhuma outra alteração de status. Caso queira reverter esse processo, terá que confirmar o recebimento do item novamente"
          texto-confirmar="Sim, cancelar pedido"
          texto-cancelar="Não"
          @confirmar="confirmarModal"
        >
          <template #gatilho>
            <BaseBotao variante="secundario" tamanho="compacto">Abrir modal de risco</BaseBotao>
          </template>
        </BaseModalConfirmacao>
        <BaseModalConfirmacao
          v-model:open="modalDeRequisicaoAberto"
          titulo="Deseja sair da edição do personalizável?"
          descricao="As alterações serão descartadas, e você será redirecionado para a tela inicial do módulo"
          texto-confirmar="Sair"
          variante="primario"
          :carregando="requisitando"
          @confirmar="confirmarRequisicao"
        >
          <template #gatilho>
            <BaseBotao variante="secundario" tamanho="compacto">
              Abrir modal com requisição
            </BaseBotao>
          </template>
        </BaseModalConfirmacao>
      </div>
      <p v-if="confirmado">Confirmado</p>
      <p v-if="resultadoDaRequisicao">{{ resultadoDaRequisicao }}</p>
    </section>

    <section aria-labelledby="titulo-avisos" class="flex flex-col gap-5">
      <h2 id="titulo-avisos" class="text-24 font-semibold">Avisos</h2>
      <div class="flex flex-wrap items-center gap-5">
        <BaseBotao
          variante="secundario"
          tamanho="compacto"
          @click="avisos.sucesso('Pedido adicionado à sacola com sucesso!')"
        >
          Aviso de sucesso
        </BaseBotao>
        <BaseBotao variante="secundario" tamanho="compacto" @click="avisos.erro(MENSAGEM_GERAL)">
          Aviso de erro
        </BaseBotao>
      </div>
    </section>

    <section aria-labelledby="titulo-carregamento" class="flex flex-col gap-5">
      <h2 id="titulo-carregamento" class="text-24 font-semibold">Carregamento</h2>
      <BaseBotao
        variante="secundario"
        tamanho="compacto"
        :aria-pressed="areaCarregando"
        class="w-fit"
        @click="areaCarregando = !areaCarregando"
      >
        Alternar carregamento
      </BaseBotao>
      <div
        class="flex h-25 w-100 items-center justify-center rounded-padrao border border-cinza-claro"
      >
        <BaseCarregando v-if="areaCarregando" />
        <p v-else>Conteúdo da área</p>
      </div>
    </section>

    <section aria-labelledby="titulo-estado-vazio" class="flex flex-col gap-5">
      <h2 id="titulo-estado-vazio" class="text-24 font-semibold">Estado vazio</h2>
      <div class="flex w-100 flex-col gap-5">
        <BaseEstadoVazio
          titulo="Ainda não tem pedidos?"
          descricao="Que tal criar algo incrível agora mesmo?"
        >
          <template #acao>
            <BaseBotao tamanho="compacto" class="w-48">Personalizar agora</BaseBotao>
          </template>
        </BaseEstadoVazio>
        <BaseEstadoVazio
          titulo="Nenhum resultado"
          descricao="Não temos estampas com esse nome ou estilo. Tente buscar algo diferente"
        />
      </div>
    </section>

    <section aria-labelledby="titulo-trilha" class="flex flex-col gap-5">
      <h2 id="titulo-trilha" class="text-24 font-semibold">Trilha</h2>
      <BaseTrilha :itens="itensDaTrilha" />
    </section>
  </main>
</template>
