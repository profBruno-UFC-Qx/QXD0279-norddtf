import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";
import { categoriasRoutes } from "./categorias.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { MeController } from "../../../../modules/users/useCases/me/MeController.js";
import { UsersRepository } from "../../../../modules/users/repositories/UsersRepository.js";

const usersRepository = new UsersRepository();
const meController = new MeController(usersRepository);

const routes: Router = Router();

routes.use('/health', healthRoutes);
routes.use('/auth', authRoutes);
routes.use('/categorias', categoriasRoutes);
routes.get('/me', requireAuth, (request, response) => meController.handle(request, response));
routes.use('/admin', requireAuth, requireAdmin(usersRepository), adminRoutes);

export { routes };