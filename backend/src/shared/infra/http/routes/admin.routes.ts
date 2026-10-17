import { Router } from "express";
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

const categoriasRepository = new CategoriasRepository();
const listarCategoriasComUsoController = new ListarCategoriasComUsoController(categoriasRepository);
const criarCategoriaController = new CriarCategoriaController(new CriarCategoriaService(categoriasRepository));
const renomearCategoriaController = new RenomearCategoriaController(new RenomearCategoriaService(categoriasRepository));
const removerCategoriaController = new RemoverCategoriaController(new RemoverCategoriaService(categoriasRepository));

const categoriasRoutes: Router = Router();

categoriasRoutes.param('id', (_request, _response, next, id) => {
    if (!idDaCategoria.safeParse(id).success) {
        next(new CategoriaNaoEncontradaError());
        return;
    }
    next();
});

categoriasRoutes.get('/', (request, response) => listarCategoriasComUsoController.handle(request, response));
categoriasRoutes.post('/', (request, response) => criarCategoriaController.handle(request, response));
categoriasRoutes.put('/:id', (request, response) => renomearCategoriaController.handle(request, response));
categoriasRoutes.delete('/:id', (request, response) => removerCategoriaController.handle(request, response));

const adminRoutes: Router = Router();

adminRoutes.use('/categorias', categoriasRoutes);

export { adminRoutes };
