<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { z } from 'zod'

import { ErroApi, MENSAGEM_GERAL } from '@/api/ErroApi'
import BotaoGoogle from '@/components/autenticacao/BotaoGoogle.vue'
import BaseBotao from '@/components/base/BaseBotao.vue'
import BaseCampoTexto from '@/components/base/BaseCampoTexto.vue'
import BaseMensagem from '@/components/base/BaseMensagem.vue'
import IconeSenha from '@/components/icones/IconeSenha.vue'
import IconeSms from '@/components/icones/IconeSms.vue'
import { CHAVE_PAINEL_AUTENTICACAO, ID_PARTE_EMAIL } from '@/layouts/painelAutenticacao'
import { useSessao } from '@/stores/sessao'
import { destinoDepoisDeEntrar, voltarInterno } from '@/utils/destino'
import { mensagemDeEspera } from '@/utils/mensagensAutenticacao'
import { aplicarErrosDaApi, schemaZod } from '@/utils/validacao'

const esquemaLogin = z.object({
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .min(1, { error: 'Informe o e-mail.' })
    .max(254, { error: 'O e-mail pode ter até 254 caracteres.' })
    .pipe(z.email({ error: 'Informe um e-mail válido.' })),
  senha: z.string({ error: 'Informe a senha.' }).min(1, { error: 'Informe a senha.' }),
})

const { aberto } = inject(CHAVE_PAINEL_AUTENTICACAO)!
const route = useRoute()
const router = useRouter()
const sessao = useSessao()
const voltar = computed(() => voltarInterno(route.query.voltar) ?? undefined)

const mensagem = sessao.consumirMensagemLogin()

const { handleSubmit, isSubmitting, setErrors } = useForm({
  validationSchema: schemaZod(esquemaLogin),
  initialValues: { email: '', senha: '' },
})

const mensagemDoEnvio = ref<string | null>(null)
const esperando = ref(false)
let timerDaEspera: ReturnType<typeof setTimeout> | undefined

function esperar(segundos: number) {
  mensagemDoEnvio.value = mensagemDeEspera(segundos)
  esperando.value = true
  clearTimeout(timerDaEspera)
  timerDaEspera = setTimeout(() => {
    esperando.value = false
    mensagemDoEnvio.value = null
  }, segundos * 1000)
}

onBeforeUnmount(() => clearTimeout(timerDaEspera))

function tratarErro(erro: unknown) {
  if (aplicarErrosDaApi(erro, setErrors)) return
  if (!(erro instanceof ErroApi)) {
    mensagemDoEnvio.value = MENSAGEM_GERAL
    return
  }
  if (erro.status === 429 && erro.segundosParaTentar !== undefined) {
    esperar(erro.segundosParaTentar)
    return
  }
  mensagemDoEnvio.value = erro.mensagem
}

const entrar = handleSubmit(
  async ({ email, senha }) => {
    mensagemDoEnvio.value = null
    try {
      await sessao.entrar(email, senha)
    } catch (erro) {
      tratarErro(erro)
      return
    }
    const destino = destinoDepoisDeEntrar(router, sessao.perfil, voltarInterno(route.query.voltar))
    await router.replace(destino)
  },
  () => {
    mensagemDoEnvio.value = null
  },
)
</script>

<template>
  <div
    class="flex w-full max-w-100.25 flex-col items-center gap-7.5"
    :class="{ 'max-md:gap-3.75': !aberto }"
  >
    <div class="flex w-full flex-col items-start gap-5">
      <div class="flex h-35.5 flex-col justify-between py-px md:h-43.75">
        <h1 class="font-destaque text-48 font-extrabold md:text-64">Entrar</h1>
        <p class="text-24">Entre com sua conta existente</p>
      </div>
      <BaseMensagem v-if="mensagem" class="w-full">{{ mensagem }}</BaseMensagem>
      <BotaoGoogle :voltar="voltar" />
    </div>
    <div
      :id="ID_PARTE_EMAIL"
      class="flex w-full flex-col items-center gap-7.5"
      :class="{ 'max-md:hidden': !aberto }"
    >
      <hr class="-mt-0.5 h-0.5 w-100 max-w-full border-0 bg-cinza-claro" />
      <form class="flex w-full flex-col gap-5" novalidate @submit="entrar">
        <p class="text-24">Ou continue com seu endereço de e-mail</p>
        <BaseCampoTexto
          nome="email"
          rotulo="E-mail"
          tipo="email"
          :icone="IconeSms"
          placeholder="Insira seu e-mail"
          autocomplete="email"
          rotulo-oculto
        />
        <BaseCampoTexto
          nome="senha"
          rotulo="Senha"
          tipo="password"
          :icone="IconeSenha"
          placeholder="Insira sua senha"
          autocomplete="current-password"
          rotulo-oculto
        />
        <BaseMensagem v-if="mensagemDoEnvio">{{ mensagemDoEnvio }}</BaseMensagem>
        <BaseBotao
          tipo="submit"
          class="w-full"
          :carregando="isSubmitting"
          :desabilitado="esperando"
        >
          Entrar
        </BaseBotao>
      </form>
    </div>
    <p class="text-16 font-semibold">
      Ainda não tem uma conta?
      <RouterLink :to="{ name: 'cadastro', query: { voltar } }" class="text-amarelo-dtf">
        Cadastre-se
      </RouterLink>
    </p>
  </div>
</template>
