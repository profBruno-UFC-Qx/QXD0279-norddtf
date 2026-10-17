import { Router } from "express";
import { validarParametro } from "../middlewares/validarParametro.js";
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

const categoriasRepository = new CategoriasRepository();
const listarCategoriasComUsoController = new ListarCategoriasComUsoController(categoriasRepository);
const criarCategoriaController = new CriarCategoriaController(new CriarCategoriaService(categoriasRepository));
const renomearCategoriaController = new RenomearCategoriaController(new RenomearCategoriaService(categoriasRepository));
const removerCategoriaController = new RemoverCategoriaController(new RemoverCategoriaService(categoriasRepository));
const atualizarMaterialController = new AtualizarMaterialController(new AtualizarMaterialService(new MateriaisRepository()));

const categoriasRoutes: Router = Router();

categoriasRoutes.param('id', validarParametro(idDaCategoria, () => new CategoriaNaoEncontradaError()));

categoriasRoutes.get('/', (request, response) => listarCategoriasComUsoController.handle(request, response));
categoriasRoutes.post('/', (request, response) => criarCategoriaController.handle(request, response));
categoriasRoutes.put('/:id', (request, response) => renomearCategoriaController.handle(request, response));
categoriasRoutes.delete('/:id', (request, response) => removerCategoriaController.handle(request, response));

const materiaisRoutes: Router = Router();

materiaisRoutes.param('tipo', validarParametro(tipoMaterial, () => new MaterialNaoEncontradoError()));

materiaisRoutes.put('/:tipo', (request, response) => atualizarMaterialController.handle(request, response));

const adminRoutes: Router = Router();

adminRoutes.use('/categorias', categoriasRoutes);
adminRoutes.use('/materiais', materiaisRoutes);

export { adminRoutes };
