import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";
import { categoriasRoutes } from "./categorias.routes.js";
import { materiaisRoutes } from "./materiais.routes.js";
import { produtosRoutes } from "./produtos.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { MeController } from "../../../../modules/users/useCases/me/MeController.js";
import { AtualizarPerfilService } from "../../../../modules/users/useCases/atualizarPerfil/AtualizarPerfilService.js";
import { AtualizarPerfilController } from "../../../../modules/users/useCases/atualizarPerfil/AtualizarPerfilController.js";
import { AtualizarEnderecoService } from "../../../../modules/users/useCases/atualizarEndereco/AtualizarEnderecoService.js";
import { AtualizarEnderecoController } from "../../../../modules/users/useCases/atualizarEndereco/AtualizarEnderecoController.js";
import { ListarSacolaService } from "../../../../modules/sacola/useCases/listarSacola/ListarSacolaService.js";
import { ListarSacolaController } from "../../../../modules/sacola/useCases/listarSacola/ListarSacolaController.js";
import { AdicionarItemSacolaService } from "../../../../modules/sacola/useCases/adicionarItemSacola/AdicionarItemSacolaService.js";
import { AdicionarItemSacolaController } from "../../../../modules/sacola/useCases/adicionarItemSacola/AdicionarItemSacolaController.js";
import { AtualizarItemSacolaService } from "../../../../modules/sacola/useCases/atualizarItemSacola/AtualizarItemSacolaService.js";
import { AtualizarItemSacolaController } from "../../../../modules/sacola/useCases/atualizarItemSacola/AtualizarItemSacolaController.js";
import { RemoverItemSacolaService } from "../../../../modules/sacola/useCases/removerItemSacola/RemoverItemSacolaService.js";
import { RemoverItemSacolaController } from "../../../../modules/sacola/useCases/removerItemSacola/RemoverItemSacolaController.js";
import { UsersRepository } from "../../../../modules/users/repositories/UsersRepository.js";
import { SacolaRepository } from "../../../../modules/sacola/repositories/SacolaRepository.js";

const usersRepository = new UsersRepository();
const sacolaRepository = new SacolaRepository();
const meController = new MeController(usersRepository);
const atualizarPerfilController = new AtualizarPerfilController(
    new AtualizarPerfilService(usersRepository)
);
const atualizarEnderecoController = new AtualizarEnderecoController(
    new AtualizarEnderecoService(usersRepository)
);
const listarSacolaController = new ListarSacolaController(
    new ListarSacolaService(sacolaRepository)
);
const adicionarItemSacolaController = new AdicionarItemSacolaController(
    new AdicionarItemSacolaService(sacolaRepository)
);
const atualizarItemSacolaController = new AtualizarItemSacolaController(
    new AtualizarItemSacolaService(sacolaRepository)
);
const removerItemSacolaController = new RemoverItemSacolaController(
    new RemoverItemSacolaService(sacolaRepository)
);

const routes: Router = Router();

routes.use('/health', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/categorias', categoriasRoutes);
routes.use('/materiais', materiaisRoutes);
routes.use('/produtos', produtosRoutes);
routes.get('/me', requireAuth, (request, response) => meController.handle(request, response));
routes.patch('/me', requireAuth, (request, response) => atualizarPerfilController.handle(request, response));
routes.put('/me/endereco', requireAuth, (request, response) => atualizarEnderecoController.handle(request, response));
routes.get('/sacola', requireAuth, (request, response) => listarSacolaController.handle(request, response));
routes.post('/sacola/itens', requireAuth, (request, response) => adicionarItemSacolaController.handle(request, response));
routes.patch('/sacola/itens/:id', requireAuth, (request, response) => atualizarItemSacolaController.handle(request, response));
routes.delete('/sacola/itens/:id', requireAuth, (request, response) => removerItemSacolaController.handle(request, response));
routes.use('/admin', requireAuth, requireAdmin(usersRepository), adminRoutes);

export { routes };