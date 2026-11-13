# :package: Entrega Final

## :computer: Como executar o projeto

Pré-requisitos: Node 22.18 ou 24.12 em diante, pnpm 10 e Docker com o plugin Compose. O banco é um PostgreSQL 17 e as imagens de produto ficam num Garage, um storage compatível com S3. Os dois sobem pelo `docker-compose.yml` do `backend/`.

No `backend/`:

1. `pnpm install`.
2. Copie o `.env.example` para `.env` e preencha os valores. As variáveis `POSTGRES_*` precisam bater com o usuário, a senha e o banco do `DATABASE_URL`. `GARAGE_RPC_SECRET`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY` são gerados na hora, com o comando que está no comentário de cada uma.
3. `docker compose up -d db garage` sobe o banco e o storage.
4. `pnpm garage:iniciar` prepara o Garage: define o layout do nó, importa a chave do `.env` e cria os buckets `S3_BUCKET` e `S3_BUCKET_TEST`. Pode ser rodado de novo sem efeito.
5. `pnpm prisma db init` cria as tabelas.
6. `pnpm seed` cria as contas e os materiais iniciais.
7. `pnpm dev` sobe a API em `http://localhost:3333`.

Os testes do backend (`pnpm test`) usam o banco do `TEST_DATABASE_URL` e o bucket `S3_BUCKET_TEST`, então precisam do banco e do Garage de pé.

No `frontend/`, crie um `.env` com `VITE_API_URL="http://localhost:3333"`, rode `pnpm install` e `pnpm dev`. O app abre em `http://localhost:5173`.

O script `docker-compose` do `package.json` do backend passa pelo Infisical e não é necessário: o `docker compose` direto lê as variáveis do `.env`. Suba sempre pelo nome do serviço (`db`, `garage`) para não recriar o que já existe.

## :key: Credenciais de acesso para teste

| Papel | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@nordtf.com | admin1234 |
| Cliente | cliente@nordtf.com | cliente1234 |

As duas contas são criadas pelo seed, que também cria os materiais DTF e DTF UV com o preço por m², a descrição e a etiqueta iniciais. Em `backend/`, com as variáveis `SEED_*` do `.env.example` copiadas para o `.env`, execute `pnpm seed`. O seed não altera conta nem material que já existe.

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
