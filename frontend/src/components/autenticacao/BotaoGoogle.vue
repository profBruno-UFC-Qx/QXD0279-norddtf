<script setup lang="ts">
import { URL_API } from '@/api/http'
import IconeGoogle from '@/components/icones/IconeGoogle.vue'
import { guardarDestinoGoogle } from '@/utils/destino'

const props = defineProps<{ voltar?: string | null }>()

function entrarComGoogle() {
  guardarDestinoGoogle(props.voltar ?? null)
  window.location.assign(`${URL_API}/auth/google`)
}
</script>

<template>
  <button
    type="button"
    class="inline-flex h-12.5 w-41 items-center justify-center gap-5 rounded-padrao bg-branco-dtf text-27 font-semibold text-preto-dtf ring-1 ring-preto-dtf ring-inset"
    @click="entrarComGoogle"
  >
    <IconeGoogle class="size-6.75 shrink-0" />
    Google
  </button>
</template>
