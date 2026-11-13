<script setup lang="ts">
import logoBranco from '@/assets/logo-branco.webp'
</script>

<template>
  <footer class="bg-preto-dtf text-branco-dtf">
    <div class="mx-auto w-full max-w-320 px-5 py-12 md:px-7.5 lg:px-12.5">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <RouterLink :to="{ name: 'landing' }" aria-label="Voltar ao início">
            <img :src="logoBranco" alt="NorDTF Personalização" class="block w-32" />
          </RouterLink>
          <p class="mt-4 max-w-xs text-14 leading-relaxed text-branco-dtf/60">
            Personalização DTF para quem não repete o visual de ninguém.
          </p>
        </div>

        <nav aria-label="Explorar">
          <h2 class="text-[11px] font-black uppercase tracking-[0.18em] text-branco-dtf/50">
            Explorar
          </h2>
          <ul class="mt-4 flex flex-col gap-3">
            <li>
              <RouterLink
                :to="{ name: 'loja-produtos' }"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Produtos
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'loja-materiais' }"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Materiais
              </RouterLink>
            </li>
            <li>
              <a
                href="#como-funciona"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Como funciona
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Conta">
          <h2 class="text-[11px] font-black uppercase tracking-[0.18em] text-branco-dtf/50">
            Conta
          </h2>
          <ul class="mt-4 flex flex-col gap-3">
            <li>
              <RouterLink
                :to="{ name: 'login' }"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Entrar
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'cadastro' }"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Criar conta
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'loja-pedidos' }"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Meus pedidos
              </RouterLink>
            </li>
          </ul>
        </nav>

        <nav aria-label="Ajuda">
          <h2 class="text-[11px] font-black uppercase tracking-[0.18em] text-branco-dtf/50">
            Ajuda
          </h2>
          <ul class="mt-4 flex flex-col gap-3">
            <li>
              <a
                href="#duvidas"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Perguntas frequentes
              </a>
            </li>
            <li>
              <a
                href="#topo"
                class="text-14 text-branco-dtf/75 transition-colors hover:text-amarelo-dtf"
              >
                Voltar ao topo ↑
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div class="mt-12 overflow-hidden border-t border-branco-dtf/10 pt-6">
        <p
          class="texto-contorno-claro select-none whitespace-nowrap font-destaque text-[clamp(3rem,15vw,11rem)] font-black uppercase leading-[0.7] tracking-[-0.06em]"
          aria-hidden="true"
        >
          Nordtf
        </p>
      </div>

      <div
        class="mt-4 flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-branco-dtf/45 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>© NorDTF Personalização</span>
        <span>Nordeste · Brasil</span>
      </div>
    </div>
  </footer>
</template>
