# :checkered_flag: Portal de Vendas NorDTF

Plataforma web para a NorDTF destinada à apresentação e comercialização de materiais e produtos para impressão DTF. A aplicação permite que clientes consultem produtos, quantidades, cores, tamanhos e materiais disponíveis, além de montar folhas DTF a partir de estampas próprias importadas para a plataforma. Ao finalizar o pedido, o cliente é direcionado para o WhatsApp da NorDTF para negociação e conclusão da compra.

## :technologist: Membros da equipe

- Matrícula: 553782 — Julian César Pereira Cardoso — Engenharia de Software
- Matrícula: 554593 — Jeferson Augusto de Melo Gomes — Engenharia de Software

## :bulb: Objetivo Geral

Desenvolver uma plataforma web para facilitar o processo de consulta, personalização e solicitação de produtos da NorDTF, proporcionando aos clientes uma experiência mais organizada e intuitiva para visualizar os produtos e materiais disponíveis, preparar suas estampas para impressão DTF e encaminhar o pedido para atendimento da empresa.

## :eyes: Público-Alvo

Clientes da NorDTF que desejam adquirir materiais e produtos para impressão DTF, incluindo pessoas físicas, profissionais de personalização, empreendedores e empresas que trabalham com confecção de peças personalizadas.

## :star2: Impacto Esperado

Espera-se que a aplicação facilite o processo de compra e solicitação de produtos da NorDTF, reduzindo a dependência de consultas manuais para informações sobre produtos, materiais, cores, tamanhos e quantidades disponíveis.

Para os clientes, a plataforma deverá proporcionar maior autonomia na consulta dos produtos e na preparação de suas estampas para impressão, permitindo organizar os arquivos em uma folha DTF antes de encaminhar o pedido para a empresa.

Para a NorDTF, espera-se uma melhor organização das informações comerciais e dos pedidos, além da redução de etapas manuais no atendimento e da melhoria da experiência dos clientes.

## :people_holding_hands: Papéis ou tipos de usuário da aplicação

A aplicação possuirá os seguintes tipos de usuário:

- **Usuário não logado:** poderá acessar a página inicial, consultar os produtos e materiais disponíveis e visualizar informações gerais da plataforma.
- **Cliente:** usuário autenticado que poderá consultar os produtos, realizar personalizações, importar suas próprias estampas, montar folhas DTF e acompanhar seus pedidos.
- **Administrador:** responsável pelo gerenciamento das informações da plataforma, incluindo produtos, disponibilidade, pedidos e demais configurações administrativas.

> As funcionalidades públicas, como a visualização da página inicial e consulta de produtos e materiais, serão acessíveis a usuários não logados. Funcionalidades relacionadas à personalização, montagem de folhas DTF, pedidos e gerenciamento administrativo serão restritas aos respectivos usuários autenticados.

## :triangular_flag_on_post: Principais funcionalidades da aplicação

### Funcionalidades acessíveis a todos os usuários

- Visualização da página inicial da NorDTF.
- Consulta dos produtos disponíveis.
- Visualização de informações sobre produtos, preços, cores, tamanhos e quantidades.
- Consulta de materiais disponíveis.
- Visualização das informações e características do material DTF.
- Acesso ao canal de atendimento da NorDTF via WhatsApp.
- Cadastro e autenticação de usuários.

### Funcionalidades restritas a clientes logados

- Acesso à área do cliente.
- Consulta e gerenciamento dos próprios pedidos.
- Visualização dos detalhes dos pedidos.
- Importação de arquivos de estampas próprios para utilização na montagem da folha DTF.
- Organização e posicionamento das estampas importadas em uma folha DTF.
- Visualização da área de impressão com régua para auxiliar na organização das estampas.
- Download/exportação da folha DTF preparada.
- Encaminhamento do pedido para atendimento da NorDTF via WhatsApp.

> A aplicação não possuirá um catálogo ou CRUD de estampas. As estampas utilizadas na montagem da folha DTF serão fornecidas diretamente pelo cliente por meio do upload de seus próprios arquivos.

### Funcionalidades restritas a administradores

- Gerenciamento de produtos.
- Ativação e desativação de produtos.
- Gerenciamento das opções de cores e tamanhos dos produtos.
- Gerenciamento das quantidades disponíveis por cor e tamanho.
- Gerenciamento de imagens de personalização associadas aos produtos.
- Visualização e gerenciamento dos pedidos realizados.
- Atualização do status dos pedidos.
- Visualização e download dos arquivos enviados ou personalizados pelo cliente quando necessário.

## :spiral_calendar: Entidades ou tabelas do sistema

As principais entidades do sistema serão:

- **Usuário** — informações dos usuários, dados de autenticação e tipo de acesso.
- **Produto** — informações dos produtos comercializados pela NorDTF.
- **Cor** — cores disponíveis para os produtos.
- **Tamanho** — tamanhos disponíveis para os produtos.
- **Estoque/Produto por variação** — quantidade disponível de cada combinação de produto, cor e tamanho.
- **Imagem de personalização** — imagens utilizadas para representar as possibilidades de personalização de um produto.
- **Pedido** — informações gerais dos pedidos realizados pelos clientes.
- **Item do Pedido** — produtos, quantidades e variações incluídas em cada pedido.
- **Arquivo de Estampa** — arquivos de estampas importados pelo cliente para utilização na montagem da folha DTF.
- **Folha DTF** — composição criada pelo cliente a partir das estampas importadas, contendo suas posições e dimensões.
- **Item da Folha DTF** — informações de cada estampa posicionada dentro da folha DTF, como arquivo, posição, dimensões e escala.
- **Status do Pedido** — situação atual do pedido dentro do processo de atendimento.
