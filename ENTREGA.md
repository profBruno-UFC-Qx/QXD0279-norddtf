# :package: Entrega Final

## :computer: Como executar o projeto

Pré-requisitos: Node 22.18 ou 24.12 em diante, pnpm 10 e Docker com o plugin Compose. O banco é um PostgreSQL 17 e as imagens de produto ficam num Garage, um storage compatível com S3. Os dois sobem pelo `docker-compose.yml` do `backend/`.

As variáveis do backend ficam no Infisical (projeto `norDTF`, ambiente `dev`), e os scripts do `package.json` as injetam com `infisical run`. Quem não tem acesso ao Infisical usa um `.env`, como explicado mais abaixo.

No `backend/`, com acesso ao Infisical:

1. `pnpm install`.
2. `infisical login`, na região US. Não é preciso criar `.env`.
3. `pnpm docker-compose up -d db garage` sobe o banco e o storage.
4. `pnpm garage:iniciar` prepara o Garage: define o layout do nó, importa a chave de acesso e cria os buckets `S3_BUCKET` e `S3_BUCKET_TEST`. Pode ser rodado de novo sem efeito.
5. `pnpm db:init` cria as tabelas.
6. `pnpm seed` cria as contas, os materiais e os produtos de exemplo.
7. `pnpm dev` sobe a API em `http://localhost:3333`.

Sem acesso ao Infisical, copie o `.env.example` para `.env` e preencha os valores. As variáveis `POSTGRES_*` precisam bater com o usuário, a senha e o banco do `DATABASE_URL`. `GARAGE_RPC_SECRET`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY` são gerados na hora, com o comando que está no comentário de cada uma. Depois rode os mesmos passos sem o Infisical:

1. `docker compose up -d db garage`.
2. `sh docker/garage/iniciar.sh`, que lê o `.env` quando as variáveis não vêm do Infisical.
3. `pnpm exec prisma db init`.
4. `pnpm exec tsx src/shared/infra/prisma/seed.ts`.
5. `pnpm exec tsx watch src/shared/infra/http/server.ts`.

Os testes do backend usam o banco do `TEST_DATABASE_URL` e o bucket `S3_BUCKET_TEST`, então precisam do banco e do Garage de pé. Com o Infisical, `pnpm test`. Com o `.env`, `pnpm exec vitest run`.

No `frontend/`, o `.env` já vem no repositório com `VITE_API_URL="http://localhost:3333"` e `VITE_WHATSAPP_NUMERO="558894389721"`. Rode `pnpm install` e `pnpm dev`. O app abre em `http://localhost:5173`. `VITE_WHATSAPP_NUMERO` é o WhatsApp da loja, só dígitos, com DDI e DDD, sem `+`, espaço nem hífen. Ela é opcional: sem ela, o link "Falar no WhatsApp" some da landing e do menu, e o resto funciona.

Suba o compose sempre pelo nome do serviço (`db`, `garage`) para não recriar o que já existe.

## :key: Credenciais de acesso para teste

| Papel | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@nordtf.com | admin1234 |
| Cliente | cliente@nordtf.com | cliente1234 |

As duas contas são criadas pelo seed, que também cria os materiais DTF e DTF UV com o preço por m², a descrição e a etiqueta iniciais, e sete produtos de exemplo com fotos, categorias e estoque. Um deles, o Moletom Canguru, fica sem estoque e por isso não aparece na loja. Em `backend/`, execute `pnpm seed` (ou, sem o Infisical, com as variáveis `SEED_*` do `.env.example` no `.env`, `pnpm exec tsx src/shared/infra/prisma/seed.ts`). O seed não altera conta, material nem produto que já existe.

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
