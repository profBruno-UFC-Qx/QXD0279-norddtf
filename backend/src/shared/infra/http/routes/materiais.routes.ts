import { Router } from "express";
import { MateriaisRepository } from "../../../../modules/materiais/repositories/MateriaisRepository.js";
import { ListarMateriaisController } from "../../../../modules/materiais/useCases/listarMateriais/ListarMateriaisController.js";

const listarMateriaisController = new ListarMateriaisController(new MateriaisRepository());

const materiaisRoutes: Router = Router();

materiaisRoutes.get('/', (request, response) => listarMateriaisController.handle(request, response));

export { materiaisRoutes };
