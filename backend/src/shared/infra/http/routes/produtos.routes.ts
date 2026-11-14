import { Router } from "express";
import { ProdutosRepository } from "../../../../modules/produtos/repositories/ProdutosRepository.js";
import { ListarProdutosDaLojaController } from "../../../../modules/produtos/useCases/listarProdutosDaLoja/ListarProdutosDaLojaController.js";

const listarProdutosDaLojaController = new ListarProdutosDaLojaController(new ProdutosRepository());

const produtosRoutes: Router = Router();

produtosRoutes.get('/', (request, response) => listarProdutosDaLojaController.handle(request, response));

export { produtosRoutes };
