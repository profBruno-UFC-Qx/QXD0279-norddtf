<script setup lang="ts">
import { computed, inject, ref } from 'vue'
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
import IconeUsuario from '@/components/icones/IconeUsuario.vue'
import { CHAVE_PAINEL_AUTENTICACAO, ID_PARTE_EMAIL } from '@/layouts/painelAutenticacao'
import { useSessao } from '@/stores/sessao'
import { destinoDepoisDeEntrar, voltarInterno } from '@/utils/destino'
import { aplicarErrosDaApi, schemaZod } from '@/utils/validacao'

const DICA_SENHA = 'Mínimo de 8 caracteres, com pelo menos uma letra e um número.'

const esquemaCadastro = z
  .object({
    nome: z
      .string({ error: 'Informe o nome.' })
      .trim()
      .min(1, { error: 'Informe o nome.' })
      .max(120, { error: 'O nome pode ter até 120 caracteres.' }),
    email: z
      .string({ error: 'Informe o e-mail.' })
      .trim()
      .toLowerCase()
      .min(1, { error: 'Informe o e-mail.' })
      .max(254, { error: 'O e-mail pode ter até 254 caracteres.' })
      .pipe(z.email({ error: 'Informe um e-mail válido.' })),
    senha: z
      .string({ error: 'Informe a senha.' })
      .min(1, { error: 'Informe a senha.' })
      .min(8, { error: 'A senha precisa ter pelo menos 8 caracteres.' })
      .max(128, { error: 'A senha pode ter no máximo 128 caracteres.' })
      .regex(/\p{L}/u, { error: 'A senha precisa ter pelo menos uma letra.' })
      .regex(/\p{Nd}/u, { error: 'A senha precisa ter pelo menos um número.' }),
    confirmacao: z.string(),
  })
  .refine((valores) => valores.senha === valores.confirmacao, {
    error: 'As senhas não conferem.',
    path: ['confirmacao'],
  })

const { aberto } = inject(CHAVE_PAINEL_AUTENTICACAO)!
const route = useRoute()
const router = useRouter()
const sessao = useSessao()
const voltar = computed(() => voltarInterno(route.query.voltar) ?? undefined)

const { handleSubmit, isSubmitting, setErrors } = useForm({
  validationSchema: schemaZod(esquemaCadastro),
  initialValues: { nome: '', email: '', senha: '', confirmacao: '' },
})

const mensagemDoEnvio = ref<string | null>(null)
const contaJaExiste = ref(false)

function limparMensagem() {
  mensagemDoEnvio.value = null
  contaJaExiste.value = false
}

function tratarErro(erro: unknown) {
  if (aplicarErrosDaApi(erro, setErrors)) return
  if (!(erro instanceof ErroApi)) {
    mensagemDoEnvio.value = MENSAGEM_GERAL
    return
  }
  mensagemDoEnvio.value = erro.mensagem
  contaJaExiste.value = erro.status === 409
}

const cadastrar = handleSubmit(async ({ nome, email, senha }) => {
  limparMensagem()
  try {
    await sessao.cadastrar(nome, email, senha)
  } catch (erro) {
    tratarErro(erro)
    return
  }
  const destino = destinoDepoisDeEntrar(router, sessao.perfil, voltarInterno(route.query.voltar))
  await router.replace(destino)
}, limparMensagem)
</script>

<template>
  <div
    class="flex w-full max-w-100.25 flex-col items-center gap-7.5"
    :class="{ 'max-md:gap-3.75': !aberto }"
  >
    <div class="flex w-full flex-col items-start gap-5 lg:items-end">
      <div class="flex h-35.5 flex-col justify-between py-px md:h-43.75 lg:items-end">
        <h1 class="font-destaque text-48 font-extrabold md:text-64">Cadastre-se</h1>
        <p class="text-24">Cadastre-se com facilidade</p>
      </div>
      <BotaoGoogle :voltar="voltar" />
    </div>
    <div
      :id="ID_PARTE_EMAIL"
      class="flex w-full flex-col items-center gap-7.5"
      :class="{ 'max-md:hidden': !aberto }"
    >
      <hr class="-mt-0.5 h-0.5 w-100 max-w-full border-0 bg-cinza-claro" />
      <form class="flex w-full flex-col gap-5" novalidate @submit="cadastrar">
        <p class="text-24 lg:text-right">Ou cadastre com seu endereço de e-mail</p>
        <BaseCampoTexto
          nome="nome"
          rotulo="Nome"
          :icone="IconeUsuario"
          placeholder="Insira seu nome"
          autocomplete="name"
          rotulo-oculto
        />
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
          autocomplete="new-password"
          :dica="DICA_SENHA"
          rotulo-oculto
        />
        <BaseCampoTexto
          nome="confirmacao"
          rotulo="Confirmação de senha"
          tipo="password"
          :icone="IconeSenha"
          placeholder="Confirme sua senha"
          autocomplete="new-password"
          rotulo-oculto
        />
        <BaseMensagem v-if="mensagemDoEnvio">
          {{ mensagemDoEnvio }}
          <RouterLink
            v-if="contaJaExiste"
            :to="{ name: 'login', query: { voltar } }"
            class="underline"
          >
            Entrar
          </RouterLink>
        </BaseMensagem>
        <BaseBotao tipo="submit" class="w-full" :carregando="isSubmitting">Cadastrar-se</BaseBotao>
      </form>
    </div>
    <p class="text-16 font-semibold">
      Já tem uma conta?
      <RouterLink :to="{ name: 'login', query: { voltar } }" class="text-amarelo-dtf">
        Entre
      </RouterLink>
    </p>
  </div>
</template>
