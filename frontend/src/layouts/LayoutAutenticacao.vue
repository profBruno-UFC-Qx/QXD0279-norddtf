<script setup lang="ts">
import { computed, provide, readonly, ref } from 'vue'
import { useRoute } from 'vue-router'

import ilustracaoLogin from '@/assets/ilustracao-autenticacao.webp'
import ilustracaoCadastro from '@/assets/ilustracao-cadastro.webp'
import logoBranco from '@/assets/logo-branco.webp'

import { CHAVE_PAINEL_AUTENTICACAO, ID_PARTE_EMAIL } from './painelAutenticacao'

interface Variante {
  ilustracao: string
  rotuloAlca: string
  classesBloco: string
  classesIlustracao: string
  classesIlustracaoAberta: string
}

const varianteLogin: Variante = {
  ilustracao: ilustracaoLogin,
  rotuloAlca: 'Entrar com e-mail',
  classesBloco: 'lg:order-2',
  classesIlustracao: 'lg:top-[6.71%] lg:left-[33.87%] lg:max-h-[86.58%] lg:max-w-[105.35%]',
  classesIlustracaoAberta: 'max-md:-bottom-21.25 max-md:h-96.25',
}

const variantePorRota: Record<string, Variante> = {
  login: varianteLogin,
  cadastro: {
    ilustracao: ilustracaoCadastro,
    rotuloAlca: 'Cadastrar com e-mail',
    classesBloco: '',
    classesIlustracao: 'lg:top-[6.71%] lg:left-[60.74%] lg:max-h-[86.58%] lg:max-w-[105.35%]',
    classesIlustracaoAberta: 'max-md:-bottom-17.75 max-md:h-95',
  },
}

const classesPorEstado = {
  recolhido: {
    bloco: 'max-md:flex-[1_1_0px]',
    ilustracao:
      'max-md:bottom-0 max-md:h-(--altura-ilustracao) [@container(height<300px)]:h-[calc(100cqh-20px)]',
    logo: 'max-md:bottom-(--altura-ilustracao) max-md:h-(--altura-logo) [@container(height<300px)]:hidden',
    painel: 'max-md:pt-13.5 max-md:pb-11.75',
    alca: 'top-[17.5px]',
  },
  aberto: {
    bloco: 'max-md:flex-[0_0_300px]',
    logo: 'max-md:bottom-[216.57px] max-md:h-[83.43px]',
    painel: 'max-md:pt-15 max-md:pb-10',
    alca: 'top-2',
  },
}

const route = useRoute()
const variante = computed(() => variantePorRota[String(route.name)] ?? varianteLogin)

const aberto = ref(false)
const classes = computed(() => classesPorEstado[aberto.value ? 'aberto' : 'recolhido'])
const classesDaIlustracao = computed(() =>
  aberto.value ? variante.value.classesIlustracaoAberta : classesPorEstado.recolhido.ilustracao,
)

function abrir() {
  aberto.value = true
}

function alternar() {
  aberto.value = !aberto.value
}

provide(CHAVE_PAINEL_AUTENTICACAO, { aberto: readonly(aberto), abrir, alternar })

const ARRASTO_MINIMO = 20
let inicioDoToque: number | null = null

function aoRolar(evento: WheelEvent) {
  if (evento.deltaY > 0) abrir()
}

function aoTocar(evento: TouchEvent) {
  inicioDoToque = evento.touches[0]?.clientY ?? null
}

function aoArrastar(evento: TouchEvent) {
  const atual = evento.touches[0]?.clientY
  if (inicioDoToque === null || atual === undefined) return
  if (inicioDoToque - atual > ARRASTO_MINIMO) abrir()
}
</script>

<template>
  <div
    class="flex min-h-svh flex-col md:gap-7.5 md:p-7.5 lg:flex-row lg:gap-2.5 lg:p-12.5"
    @wheel.passive="aoRolar"
  >
    <div
      class="relative bg-amarelo-dtf [--altura-ilustracao:min(385px,calc((100cqh-20px)*385/499.43))] [--altura-logo:min(114.43px,calc((100cqh-20px)*114.43/499.43))] max-md:max-h-159.25 max-md:min-h-50 max-md:overflow-hidden max-md:transition-[flex] max-md:duration-300 max-md:[container-type:size] max-md:motion-reduce:transition-none md:rounded-painel md:max-lg:h-105 lg:w-[45.33%]"
      :class="[variante.classesBloco, classes.bloco]"
    >
      <img
        :src="variante.ilustracao"
        alt=""
        class="absolute left-1/2 w-auto max-w-none -translate-x-1/2 max-md:transition-[height,bottom] max-md:duration-300 max-md:motion-reduce:transition-none md:max-lg:top-5 md:max-lg:h-83.5"
        :class="[variante.classesIlustracao, classesDaIlustracao]"
      />
      <img
        :src="logoBranco"
        alt="NorDTF"
        class="absolute left-1/2 w-auto max-w-none -translate-x-1/2 max-md:transition-[height,bottom] max-md:duration-300 max-md:motion-reduce:transition-none md:max-lg:top-89 md:max-lg:h-14 lg:bottom-1.5 lg:h-14"
        :class="classes.logo"
      />
    </div>
    <main
      class="relative flex flex-col items-center bg-branco-dtf max-md:-mt-7.5 max-md:rounded-t-[30px] max-md:px-2.5 md:bg-transparent lg:flex-1 lg:justify-center lg:p-2.5"
      :class="classes.painel"
      @touchstart.passive="aoTocar"
      @touchmove.passive="aoArrastar"
    >
      <button
        type="button"
        class="absolute left-1/2 grid h-11 w-25 -translate-x-1/2 place-items-center md:hidden"
        :class="classes.alca"
        :aria-label="variante.rotuloAlca"
        :aria-expanded="aberto"
        :aria-controls="ID_PARTE_EMAIL"
        @click="alternar"
      >
        <span class="block h-0.75 w-25 bg-preto-dtf"></span>
      </button>
      <RouterView />
    </main>
  </div>
</template>
