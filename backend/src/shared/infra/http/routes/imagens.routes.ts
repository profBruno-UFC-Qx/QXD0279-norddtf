import { Router } from "express";
import { armazenamento } from "../../armazenamento/index.js";
import { LerImagemController } from "../../../../modules/imagens/useCases/lerImagem/LerImagemController.js";

const lerImagemController = new LerImagemController(armazenamento);

const imagensRoutes: Router = Router();

imagensRoutes.get('/*chave', (request, response, next) => lerImagemController.handle(request, response, next));

export { imagensRoutes };
