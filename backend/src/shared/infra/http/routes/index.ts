import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { MeController } from "../../../../modules/users/useCases/me/MeController.js";
import { UsersRepository } from "../../../../modules/users/repositories/UsersRepository.js";

const usersRepository = new UsersRepository();
const meController = new MeController(usersRepository);

const routes: Router = Router();

routes.use('/health', healthRoutes);
routes.use('/auth', authRoutes);
routes.get('/me', requireAuth, (request, response) => meController.handle(request, response));

export { routes };