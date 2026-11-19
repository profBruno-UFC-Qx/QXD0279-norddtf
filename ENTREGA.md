# :package: Entrega Final

## :computer: Como executar o projeto

Pré-requisito: Docker com o plugin Compose 2.25 ou mais novo, o que dá pra conferir com `docker compose version`. Node e pnpm são opcionais e servem só pros atalhos do `package.json` da raiz e pra mudar o schema do banco. As dependências de cada app são instaladas dentro das imagens, então não é preciso rodar `pnpm install` pra subir o projeto.

O `compose.yaml` da raiz sobe cinco serviços: `db` (PostgreSQL 17), `garage` (storage compatível com S3, onde ficam as imagens de produto), `setup`, `api` e `web`. A cada `up`, o `setup` prepara o Garage, aplica o schema no banco e roda o seed, e só depois a API sobe. Na primeira vez o build das imagens leva alguns minutos. Se a API não subir, o lugar de olhar é `docker compose logs setup`.

### Sem Infisical

1. Na raiz do repositório, copie o `.env.example` para `.env`.
2. Preencha `SESSION_SECRET`, `GARAGE_RPC_SECRET`, `GARAGE_ADMIN_TOKEN`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY` com o comando que está no comentário de cada uma. No Windows, rode esses comandos pelo Git Bash, que já traz o `openssl`. As variáveis `SEED_*` são obrigatórias e já vêm com as contas da tabela de credenciais. As `GOOGLE_*` podem ficar vazias, e aí só o login com Google deixa de funcionar.
3. Rode `docker compose up --build --watch`.

Os outros comandos são os do próprio Compose: `docker compose down` derruba os containers e mantém os dados, `docker compose down -v` apaga também o banco e as imagens de produto, e `docker compose logs -f` acompanha os logs. Os testes do backend rodam dentro do container da API, com `docker compose exec -T api pnpm exec vitest run`.

### Com Infisical

As variáveis ficam no Infisical (projeto `norDTF`, ambiente `dev`). Rode `infisical login`, na região US, e depois `pnpm dev` na raiz. Não é preciso criar `.env`.

Os atalhos da raiz passam todos pelo `infisical run`, porque o Compose precisa das variáveis em qualquer comando, até no `down`:

| Atalho | O que faz |
| --- | --- |
| `pnpm dev` | Sobe tudo com hot reload. |
| `pnpm down` | Derruba os containers e mantém os dados. |
| `pnpm apagar-dados` | Derruba os containers e apaga o banco e as imagens de produto. O próximo `up` recomeça do seed. |
| `pnpm logs` | Acompanha os logs. Aceita o nome do serviço, como em `pnpm logs api`. |
| `pnpm seed` | Roda o seed de novo, dentro do container da API. |
| `pnpm test` | Roda os testes do backend, dentro do container da API. |
| `pnpm prod` e `pnpm prod:down` | Sobem e derrubam a versão de produção. |

Pra rodar outro comando do Compose com as variáveis do Infisical, prefixe `infisical run --`, como em `infisical run -- docker compose ps`.

### Endereços e banco

O front abre em `http://localhost:5173` e a API responde em `http://localhost:3333`. Se a porta 5432 já estiver ocupada por um PostgreSQL instalado na máquina, defina `DB_PORTA` com outra porta. Dentro do Compose a API sempre fala com o banco em `db:5432`, então a porta do `DATABASE_URL` e do `TEST_DATABASE_URL` só precisa acompanhar o `DB_PORTA` pra quem roda os scripts do `backend/` no host.

O banco pode ser acessado pelo `psql` do próprio container:

```sh
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Com Infisical, prefixe `infisical run --`. No Git Bash do Windows, prefixe também `winpty`, porque o `psql` é interativo. Por um cliente gráfico como o pgAdmin, conecte em `localhost`, na porta do `DB_PORTA` (5432 por padrão), com o usuário, a senha e o banco das variáveis `POSTGRES_*`.

`VITE_WHATSAPP_NUMERO` é o WhatsApp da loja, só dígitos, com DDI e DDD, sem `+`, espaço nem hífen. Ela é opcional: sem ela, o link "Falar no WhatsApp" some da landing e do menu, e o resto funciona.

### Hot reload e dependências

Com o `--watch`, o Compose sincroniza `src/` e `test/` do backend e `src/`, `public/` e `index.html` do front pros containers. Mudança no `package.json` ou no `pnpm-lock.yaml` reconstrói a imagem. Sem o `--watch`, o código fica congelado na imagem do último build. Os `tsconfig*.json` ficam fora do watch, então mudança neles pede outro `up --build`.

Com Node no host, uma dependência nova entra com `pnpm add <pacote>` dentro de `backend/` ou `frontend/`. Sem Node, o mesmo pode ser feito pelo container:

```sh
docker compose run --rm --no-deps -v ./backend:/app api pnpm add <pacote> --lockfile-only --store-dir /tmp/pnpm-store
```

Pro front, troque `./backend` e `api` por `./frontend` e `web`. O rebuild da imagem instala com `--frozen-lockfile`, então o `package.json` e o `pnpm-lock.yaml` precisam mudar juntos, que é o que esse comando faz. No Git Bash, prefixe `MSYS_NO_PATHCONV=1` pra o caminho `/app` não ser convertido.

### Mudança no schema do banco

Os comandos desta parte que rodam em `backend/` precisam de Node e de um `pnpm install` feito ali antes. O schema fica em `backend/src/shared/infra/prisma/schema.prisma`. Depois de mudar o schema, emita o contrato com `pnpm contract:emit` em `backend/`. Com o `--watch` ligado, o `setup` não roda de novo sozinho. Rode `docker compose up --build setup` em outro terminal, ou reinicie o `up`.

Quando o schema novo pede uma operação que apaga dados, como remover uma coluna, o `setup` falha de propósito. Confira o que vai ser feito e aplique à mão:

```sh
docker compose run --build --rm setup pnpm exec prisma db update --dry-run --format human
docker compose run --build --rm setup pnpm exec prisma db update --format human --no-interactive --confirm <POSTGRES_DB>
```

Produção aplica o schema por migração, e não pelo `db update`. Toda mudança no schema precisa de uma migração nova, gerada em `backend/` depois do `pnpm contract:emit`:

```sh
pnpm exec prisma migration plan --from <pasta da última migração> --name <slug>
```

A pasta da última migração é a mais recente em `backend/migrations/app/`. Versione a pasta nova e o snapshot em `backend/migrations/snapshots/`. A pasta `backend/migrations/app/refs/` fica fora do git. Sem a migração, o dev continua funcionando, mas o `setup` de produção falha com `MIGRATION.PATH_UNREACHABLE` e a API não sobe.

### Produção

`pnpm prod` sobe a versão de produção num projeto separado do Compose, o `nordtf-prod`, com volumes próprios. Derrube o dev antes, porque as duas versões publicam a API na porta 3333. O front fica em `http://localhost:8080`, servido já compilado, e o banco e o Garage não são publicados no host. O `setup` aplica as migrações e roda um seed reduzido, que cria só os materiais e a conta de admin. Pra derrubar, use `pnpm prod:down`, porque o `down` desse projeto precisa dos mesmos dois arquivos do Compose. Sem Infisical, os comandos são `docker compose -f compose.yaml -f compose.prod.yaml up -d --build` e o mesmo com `down`, com um `.env` de valores de produção.

O cookie de sessão de produção só trafega por HTTPS. Pra testar na própria máquina, por HTTP, rode `COOKIE_SECURE=false pnpm prod`. No PowerShell, `$env:COOKIE_SECURE="false"; pnpm prod`. Essa variável nunca vai pro Infisical nem pro servidor. O ambiente `prod` do Infisical está hoje com valores desse teste local, com o `FRONTEND_URL` em `http://localhost:8080` e o `VITE_API_URL` em `http://localhost:3333`. Num deploy de verdade, os dois passam a ser os endereços do servidor. Sem Infisical, os mesmos valores vão no `.env`. No servidor, o Infisical autentica com o `INFISICAL_TOKEN` de uma machine identity, no lugar do `infisical login`.

## :key: Credenciais de acesso para teste

| Papel | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@nordtf.com | admin1234 |
| Cliente | cliente@nordtf.com | cliente1234 |

As duas contas são criadas pelo seed, que também cria os materiais DTF e DTF UV com o preço por m², a descrição e a etiqueta iniciais, e sete produtos de exemplo com fotos, categorias e estoque. Um deles, o Moletom Canguru, fica sem estoque e por isso não aparece na loja. O seed roda sozinho a cada `up` e não altera conta, material nem produto que já existe.

## :robot: Uso de ferramentas de Inteligência Artificial

Você usou alguma ferramenta de IA (ex: ChatGPT, Claude, GitHub Copilot) no desenvolvimento deste projeto? Se sim, indique qual(is) ferramenta(s), explique como você a utilizou e como ela foi capaz de ajudá-lo. Se não usou, indique "Não utilizei".

## :construction: Maiores dificuldades encontradas

Descreva as principais dificuldades técnicas ou de organização enfrentadas pela equipe durante o desenvolvimento.

## :warning: Limitações conhecidas

Liste bugs conhecidos ou funcionalidades que não foram implementadas, se houver.

<!-- kit:fim-secoes-genericas -->

## :desktop_computer: Tecnologias e frameworks utilizados

**Frontend:**

Lista as tecnologias, frameworks e bibliotecas utilizados.

**Backend:**

Lista as tecnologias, frameworks e bibliotecas utilizados.


## :shipit: Operações implementadas para cada entidade da aplicação


| Entidade| Criação | Leitura | Atualização | Remoção |
| --- | --- | --- | --- | --- |
| Categoria | X | X | X | X |
| Produto | X | X | X | X |
| Material |  | X | X |  |

> Lembre-se que é necessário implementar o CRUD de pelo menos duas entidades.

## :neckbeard: Rotas da API REST utilizadas

| Método HTTP | URL |
| --- | --- |
| POST | /auth/signup |
| POST | /auth/login |
| POST | /auth/logout |
| GET | /auth/google |
| GET | /auth/google/callback |
| GET | /me |
| GET | /categorias |
| GET | /admin/categorias |
| POST | /admin/categorias |
| PUT | /admin/categorias/:id |
| DELETE | /admin/categorias/:id |
| GET | /materiais |
| PUT | /admin/materiais/:tipo |
| POST | /admin/imagens |
| GET | /imagens/*chave |
| GET | /produtos |
| GET | /produtos/:id |
| GET | /admin/produtos |
| GET | /admin/produtos/:id |
| POST | /admin/produtos |
| PUT | /admin/produtos/:id |
| PATCH | /admin/produtos/:id/situacao |
| DELETE | /admin/produtos/:id |
