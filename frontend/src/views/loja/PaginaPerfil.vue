<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useSessao } from '@/stores/sessao'
import { useAvisos } from '@/stores/avisos'
import { atualizarPerfil, atualizarEndereco } from '@/api/perfil'
import { mascararCep } from '@/utils/mascaras'
import { somenteDigitos } from '@/utils/formatacao'

import BaseBotao from '@/components/base/BaseBotao.vue'

const sessao = useSessao()
const avisos = useAvisos()
const router = useRouter()

const perfilCompleto = computed(() => sessao.usuario?.perfilCompleto ?? false)
const pendencias = computed(() => sessao.usuario?.pendencias ?? [])

const salvando = ref(false)

// Estado do formulário
const form = ref({
  nome: sessao.usuario?.nome ?? '',
  telefone: sessao.usuario?.telefone ?? '',
  cep: sessao.usuario?.endereco?.cep ?? '',
  logradouro: sessao.usuario?.endereco?.logradouro ?? '',
  numero: sessao.usuario?.endereco?.numero ?? '',
  complemento: sessao.usuario?.endereco?.complemento ?? '',
  bairro: sessao.usuario?.endereco?.bairro ?? '',
  cidade: sessao.usuario?.endereco?.cidade ?? '',
  estado: sessao.usuario?.endereco?.estado ?? '',
})

// Busca CEP ViaCEP
async function buscarCep() {
  const digitos = somenteDigitos(form.value.cep)
  if (digitos.length !== 8) return

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
    const dados = await resposta.json()
    if (dados.erro) {
      form.value.cidade = ''
      form.value.estado = ''
      form.value.bairro = ''
      form.value.logradouro = ''
      return
    }
    form.value.cep = mascararCep(dados.cep)
    form.value.logradouro = dados.logradouro
    form.value.bairro = dados.bairro
    form.value.cidade = dados.localidade
    form.value.estado = dados.uf
  } catch {
    // Falha na busca não impede salvar
  }
}

// Validação
function validarContato(): Record<string, string> {
  const erros: Record<string, string> = {}

  if (!form.value.nome || form.value.nome.trim().length === 0) {
    erros.nome = 'Informe o nome.'
  } else if (form.value.nome.length > 120) {
    erros.nome = 'O nome pode ter até 120 caracteres.'
  }

  if (form.value.telefone && form.value.telefone.trim().length > 0) {
    const digitos = somenteDigitos(form.value.telefone)
    if (digitos.length !== 10 && digitos.length !== 11) {
      erros.telefone = 'Informe um telefone válido com DDD.'
    } else {
      const ddd = Number(digitos.slice(0, 2))
      if (ddd < 11 || ddd > 99) {
        erros.telefone = 'Informe um telefone válido com DDD.'
      } else if (digitos.length === 11 && digitos[2] !== '9') {
        erros.telefone = 'Informe um telefone válido com DDD.'
      }
    }
  }

  return erros
}

function validarEndereco(): Record<string, string> {
  const erros: Record<string, string> = {}

  const campos: Record<string, string> = {
    cep: 'CEP',
    logradouro: 'logradouro',
    numero: 'número',
    bairro: 'bairro',
    cidade: 'cidade',
    estado: 'estado',
  }

  const algumPreenchido = Object.entries(form.value).some(([chave, valor]) => {
    if (chave === 'nome' || chave === 'telefone' || chave === 'complemento') return false
    return valor && String(valor).trim().length > 0
  })

  if (!algumPreenchido) return erros

  for (const [campo, rotulo] of Object.entries(campos)) {
    const valor = form.value[campo as keyof typeof form.value]
    if (!valor || String(valor).trim().length === 0) {
      erros[campo] = `Informe ${campo === 'estado' ? 'o' : 'o'} ${rotulo}.`
      continue
    }

    if (campo === 'cep') {
      const digitos = String(valor).replace(/\D/g, '')
      if (digitos.length !== 8) {
        erros.cep = 'Informe um CEP válido.'
      }
    } else if (campo === 'cidade' && String(valor).length > 80) {
      erros.cidade = 'Informe a cidade.'
    } else if (campo === 'estado') {
      const validos = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
      if (!validos.includes(String(valor).toUpperCase())) {
        erros.estado = 'Selecione o estado.'
      }
    } else if (campo === 'bairro' && String(valor).length > 80) {
      erros.bairro = 'Informe o bairro.'
    } else if (campo === 'logradouro' && String(valor).length > 120) {
      erros.logradouro = 'Informe o logradouro.'
    } else if (campo === 'numero' && String(valor).length > 10) {
      erros.numero = 'Informe o número.'
    }
  }

  return erros
}

async function salvar() {
  const errosContato = validarContato()
  const errosEndereco = validarEndereco()
  const erros = { ...errosContato, ...errosEndereco }

  if (Object.keys(erros).length > 0) {
    // Marca campos com erro (pode ser expandido com vee-validate)
    return
  }

  salvando.value = true
  try {
    await atualizarPerfil(form.value.nome.trim(), form.value.telefone || null)
    await atualizarEndereco({
      cep: form.value.cep.replace(/\D/g, ''),
      logradouro: form.value.logradouro.trim(),
      numero: form.value.numero.trim(),
      complemento: form.value.complemento ? form.value.complemento.trim() : null,
      bairro: form.value.bairro.trim(),
      cidade: form.value.cidade.trim(),
      estado: form.value.estado.toUpperCase().trim(),
    })

    await sessao.recarregar()
    avisos.sucesso('Dados atualizados com sucesso.')

    // Se veio do checkout e perfil ficou completo, volta para finalizar pagamento
    if (perfilCompleto.value && router.currentRoute.value.query.voltar) {
      router.push(String(router.currentRoute.value.query.voltar))
    }
  } catch (erro: unknown) {
    if (erro && typeof erro === 'object' && 'erros' in erro) {
      // Pode ser expandido para mostrar erros por campo
      console.error('Erro de validação:', (erro as { erros: unknown }).erros)
    }
  } finally {
    salvando.value = false
  }
}

onMounted(() => {
  sessao.recarregar()
})

function pendenciasTexto() {
  const nomes: Record<string, string> = {
    nome: 'nome',
    telefone: 'telefone',
    cep: 'CEP',
    logradouro: 'logradouro',
    numero: 'número',
    bairro: 'bairro',
    cidade: 'cidade',
    estado: 'estado',
  }
  return pendencias.value.map((p: string) => nomes[p] ?? p).join(', ')
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-5 py-10 md:px-7.5 lg:px-12.5">
    <h1 class="font-destaque text-32 font-black uppercase leading-[0.85] tracking-[-0.04em] mb-2">
      Meu perfil
    </h1>
    <p class="text-14 leading-relaxed text-cinza-dtf mb-8">
      Atualize seus dados de contato e endereço de entrega.
    </p>

    <!-- Aviso de perfil incompleto quando vindo do checkout -->
    <div v-if="!perfilCompleto && router.currentRoute.value.query.voltar" class="mb-8 p-4 border border-amarelo-dtf bg-amarelo-dtf/10 rounded-padrao">
      <p class="text-13 font-bold uppercase tracking-[0.12em] text-preto-dtf">
        Para finalizar seu pedido, complete seus dados de contato e endereço de entrega.
      </p>
      <p class="mt-1 text-13 text-cinza-dtf">
        Pendentes: {{ pendenciasTexto() }}
      </p>
    </div>

    <form @submit.prevent="salvar" class="grid gap-6">
      <!-- Informações de contato -->
      <section class="border border-preto-dtf/10 rounded-padrao p-5">
        <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-cinza-dtf mb-4">
          Informações de contato
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="col-span-2">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Nome</label>
            <input
              v-model="form.nome"
              type="text"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
              maxlength="120"
            />
          </div>
          <div class="col-span-2">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">E-mail (somente leitura)</label>
            <input
              :value="sessao.usuario?.email"
              type="email"
              readonly
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 bg-cinza-claro text-cinza-dtf"
            />
            <p class="mt-1 text-[11px] text-cinza-escuro">
              O e-mail é o login da sua conta e não pode ser alterado aqui.
            </p>
          </div>
          <div>
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Telefone</label>
            <input
              v-model="form.telefone"
              type="tel"
              :placeholder="'(99) 99999-9999'"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
              maxlength="15"
            />
          </div>
        </div>
      </section>

      <!-- Endereço de entrega -->
      <section class="border border-preto-dtf/10 rounded-padrao p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-cinza-dtf">
            Endereço de entrega
          </h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">CEP</label>
            <div class="relative">
              <input
                v-model="form.cep"
                type="text"
                :placeholder="'99999-999'"
                @blur="buscarCep"
                class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors pr-10"
                maxlength="9"
              />
              <button
                type="button"
                @click="buscarCep"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-[0.1em] text-amarelo-dtf hover:opacity-70"
              >
                Buscar
              </button>
            </div>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Logradouro</label>
            <input
              v-model="form.logradouro"
              type="text"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Número</label>
            <input
              v-model="form.numero"
              type="text"
              placeholder="S/N"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
              maxlength="10"
            />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Complemento</label>
            <input
              v-model="form.complemento"
              type="text"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
            />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Bairro</label>
            <input
              v-model="form.bairro"
              type="text"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
            />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Cidade</label>
            <input
              v-model="form.cidade"
              type="text"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
            />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-13 font-bold uppercase tracking-[0.12em] mb-1">Estado (UF)</label>
            <select
              v-model="form.estado"
              class="w-full border border-preto-dtf/20 rounded-padrao px-4 py-3 text-14 focus:border-preto-dtf focus:outline-none transition-colors"
            >
              <option value="">Selecione o estado</option>
              <option v-for="uf in ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']" :key="uf" :value="uf">
                {{ uf }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <div class="mt-8 flex gap-3">
        <BaseBotao
          variant="primario"
          :disabled="salvando"
          @click="salvar"
        >
          Salvar alterações
        </BaseBotao>
      </div>
    </form>
  </div>
</template>
