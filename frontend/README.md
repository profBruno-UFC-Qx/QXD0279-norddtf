# Frontend

Aplicação web do NorDTF, em Vue 3 com Composition API, Vue Router, Pinia e TypeScript, sobre Vite.

## Pré-requisitos

- Node `^22.18.0` ou `>=24.12.0`.
- pnpm `10.16.1`.
- Backend rodando em `http://localhost:3333`, com `FRONTEND_URL=http://localhost:5173` no `backend/.env`. O backend só libera CORS e cookie de sessão para essa origem.

## Configuração

A URL da API vem de `VITE_API_URL`, definida em `.env` com `http://localhost:3333`. Para usar outro valor na sua máquina, crie um `.env.local`, que não é versionado. Toda variável `VITE_` vai para o bundle, então nenhum segredo entra aqui.

## Como rodar

```sh
pnpm install
pnpm dev
```

O app sobe em `http://localhost:5173`. A porta é fixa: se ela estiver ocupada, o `pnpm dev` falha em vez de subir em outra porta, porque em outra origem o backend recusa as chamadas.

## Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento na porta 5173 |
| `pnpm type-check` | Checagem de tipos com `vue-tsc` |
| `pnpm lint` | oxlint e ESLint, corrigindo o que for automático |
| `pnpm format` | Prettier em `src/` |
| `pnpm build` | Checagem de tipos e build de produção em `dist/` |
| `pnpm preview` | Serve o build de produção |
