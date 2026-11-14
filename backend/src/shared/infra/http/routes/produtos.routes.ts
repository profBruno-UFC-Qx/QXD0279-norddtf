import { Router } from "express";
import { validarParametro } from "../middlewares/validarParametro.js";
import { idDoProduto } from "../../../../modules/produtos/schemas/produtoSchemas.js";
import { ProdutoNaoEncontradoError } from "../../../../modules/produtos/errors/ProdutoNaoEncontradoError.js";
import { ProdutosRepository } from "../../../../modules/produtos/repositories/ProdutosRepository.js";
import { ListarProdutosDaLojaController } from "../../../../modules/produtos/useCases/listarProdutosDaLoja/ListarProdutosDaLojaController.js";
import { DetalharProdutoDaLojaController } from "../../../../modules/produtos/useCases/detalharProdutoDaLoja/DetalharProdutoDaLojaController.js";

const produtosRepository = new ProdutosRepository();
const listarProdutosDaLojaController = new ListarProdutosDaLojaController(produtosRepository);
const detalharProdutoDaLojaController = new DetalharProdutoDaLojaController(produtosRepository);

const produtosRoutes: Router = Router();

produtosRoutes.param('id', validarParametro(idDoProduto, () => new ProdutoNaoEncontradoError()));

produtosRoutes.get('/', (request, response) => listarProdutosDaLojaController.handle(request, response));
produtosRoutes.get('/:id', (request, response) => detalharProdutoDaLojaController.handle(request, response));

export { produtosRoutes };
