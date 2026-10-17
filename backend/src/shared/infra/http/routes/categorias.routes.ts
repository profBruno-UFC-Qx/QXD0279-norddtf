import { Router } from "express";
import { CategoriasRepository } from "../../../../modules/categorias/repositories/CategoriasRepository.js";
import { ListarCategoriasController } from "../../../../modules/categorias/useCases/listarCategorias/ListarCategoriasController.js";

const listarCategoriasController = new ListarCategoriasController(new CategoriasRepository());

const categoriasRoutes: Router = Router();

categoriasRoutes.get('/', (request, response) => listarCategoriasController.handle(request, response));

export { categoriasRoutes };
