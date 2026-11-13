import { Router } from "express";
import { validarParametro } from "../middlewares/validarParametro.js";
import { receberArquivo } from "../middlewares/receberArquivo.js";
import { armazenamento } from "../../armazenamento/index.js";
import { idDaCategoria } from "../../../../modules/categorias/schemas/categoriaSchemas.js";
import { CategoriaNaoEncontradaError } from "../../../../modules/categorias/errors/CategoriaNaoEncontradaError.js";
import { CategoriasRepository } from "../../../../modules/categorias/repositories/CategoriasRepository.js";
import { ListarCategoriasComUsoController } from "../../../../modules/categorias/useCases/listarCategoriasComUso/ListarCategoriasComUsoController.js";
import { CriarCategoriaService } from "../../../../modules/categorias/useCases/criarCategoria/CriarCategoriaService.js";
import { CriarCategoriaController } from "../../../../modules/categorias/useCases/criarCategoria/CriarCategoriaController.js";
import { RenomearCategoriaService } from "../../../../modules/categorias/useCases/renomearCategoria/RenomearCategoriaService.js";
import { RenomearCategoriaController } from "../../../../modules/categorias/useCases/renomearCategoria/RenomearCategoriaController.js";
import { RemoverCategoriaService } from "../../../../modules/categorias/useCases/removerCategoria/RemoverCategoriaService.js";
import { RemoverCategoriaController } from "../../../../modules/categorias/useCases/removerCategoria/RemoverCategoriaController.js";
import { tipoMaterial } from "../../../../modules/materiais/schemas/materialSchemas.js";
import { MaterialNaoEncontradoError } from "../../../../modules/materiais/errors/MaterialNaoEncontradoError.js";
import { MateriaisRepository } from "../../../../modules/materiais/repositories/MateriaisRepository.js";
import { AtualizarMaterialService } from "../../../../modules/materiais/useCases/atualizarMaterial/AtualizarMaterialService.js";
import { AtualizarMaterialController } from "../../../../modules/materiais/useCases/atualizarMaterial/AtualizarMaterialController.js";
import { EnviarImagemService } from "../../../../modules/imagens/useCases/enviarImagem/EnviarImagemService.js";
import { EnviarImagemController } from "../../../../modules/imagens/useCases/enviarImagem/EnviarImagemController.js";
import { idDoProduto } from "../../../../modules/produtos/schemas/produtoSchemas.js";
import { ProdutoNaoEncontradoError } from "../../../../modules/produtos/errors/ProdutoNaoEncontradoError.js";
import { ProdutosRepository } from "../../../../modules/produtos/repositories/ProdutosRepository.js";
import { CadastrarProdutoService } from "../../../../modules/produtos/useCases/cadastrarProduto/CadastrarProdutoService.js";
import { CadastrarProdutoController } from "../../../../modules/produtos/useCases/cadastrarProduto/CadastrarProdutoController.js";
import { DetalharProdutoController } from "../../../../modules/produtos/useCases/detalharProduto/DetalharProdutoController.js";
import { EditarProdutoService } from "../../../../modules/produtos/useCases/editarProduto/EditarProdutoService.js";
import { EditarProdutoController } from "../../../../modules/produtos/useCases/editarProduto/EditarProdutoController.js";
import { MudarSituacaoService } from "../../../../modules/produtos/useCases/mudarSituacao/MudarSituacaoService.js";
import { MudarSituacaoController } from "../../../../modules/produtos/useCases/mudarSituacao/MudarSituacaoController.js";
import { RemoverProdutoService } from "../../../../modules/produtos/useCases/removerProduto/RemoverProdutoService.js";
import { RemoverProdutoController } from "../../../../modules/produtos/useCases/removerProduto/RemoverProdutoController.js";

const categoriasRepository = new CategoriasRepository();
const listarCategoriasComUsoController = new ListarCategoriasComUsoController(categoriasRepository);
const criarCategoriaController = new CriarCategoriaController(new CriarCategoriaService(categoriasRepository));
const renomearCategoriaController = new RenomearCategoriaController(new RenomearCategoriaService(categoriasRepository));
const removerCategoriaController = new RemoverCategoriaController(new RemoverCategoriaService(categoriasRepository));
const atualizarMaterialController = new AtualizarMaterialController(new AtualizarMaterialService(new MateriaisRepository()));
const enviarImagemController = new EnviarImagemController(new EnviarImagemService(armazenamento));
const produtosRepository = new ProdutosRepository();
const cadastrarProdutoController = new CadastrarProdutoController(new CadastrarProdutoService(produtosRepository, armazenamento));
const detalharProdutoController = new DetalharProdutoController(produtosRepository);
const editarProdutoController = new EditarProdutoController(new EditarProdutoService(produtosRepository, armazenamento));
const mudarSituacaoController = new MudarSituacaoController(new MudarSituacaoService(produtosRepository));
const removerProdutoController = new RemoverProdutoController(new RemoverProdutoService(produtosRepository));

const categoriasRoutes: Router = Router();

categoriasRoutes.param('id', validarParametro(idDaCategoria, () => new CategoriaNaoEncontradaError()));

categoriasRoutes.get('/', (request, response) => listarCategoriasComUsoController.handle(request, response));
categoriasRoutes.post('/', (request, response) => criarCategoriaController.handle(request, response));
categoriasRoutes.put('/:id', (request, response) => renomearCategoriaController.handle(request, response));
categoriasRoutes.delete('/:id', (request, response) => removerCategoriaController.handle(request, response));

const materiaisRoutes: Router = Router();

materiaisRoutes.param('tipo', validarParametro(tipoMaterial, () => new MaterialNaoEncontradoError()));

materiaisRoutes.put('/:tipo', (request, response) => atualizarMaterialController.handle(request, response));

const imagensRoutes: Router = Router();

imagensRoutes.post('/', receberArquivo, (request, response) => enviarImagemController.handle(request, response));

const produtosRoutes: Router = Router();

produtosRoutes.param('id', validarParametro(idDoProduto, () => new ProdutoNaoEncontradoError()));

produtosRoutes.post('/', (request, response) => cadastrarProdutoController.handle(request, response));
produtosRoutes.get('/:id', (request, response) => detalharProdutoController.handle(request, response));
produtosRoutes.put('/:id', (request, response) => editarProdutoController.handle(request, response));
produtosRoutes.patch('/:id/situacao', (request, response) => mudarSituacaoController.handle(request, response));
produtosRoutes.delete('/:id', (request, response) => removerProdutoController.handle(request, response));

const adminRoutes: Router = Router();

adminRoutes.use('/categorias', categoriasRoutes);
adminRoutes.use('/materiais', materiaisRoutes);
adminRoutes.use('/imagens', imagensRoutes);
adminRoutes.use('/produtos', produtosRoutes);

export { adminRoutes };
