# :package: Entrega Final

## :computer: Como executar o projeto

Descreva os pré-requisitos (linguagem/SDK e versão, ferramentas necessárias) e o passo a passo completo para compilar e rodar o projeto localmente.

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
