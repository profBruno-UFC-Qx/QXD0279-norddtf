import { Router } from "express";
import { oauth2Client } from "../../oauth/google/index.js";
import { GoogleAuthService } from "../../../../modules/users/useCases/googleAuth/GoogleAuthService.js";
import { GoogleAuthController } from "../../../../modules/users/useCases/googleAuth/GoogleAuthController.js";
import { UsersRepository } from "../../../../modules/users/repositories/UsersRepository.js";

const usersRepository = new UsersRepository();
const googleAuthService = new GoogleAuthService(oauth2Client);
const googleAuthController = new GoogleAuthController(googleAuthService, usersRepository);

const authRoutes: Router = Router();

authRoutes.get('/google', (request, response) => googleAuthController.handle(request, response));
authRoutes.get('/google/callback', (request, response) => googleAuthController.callback(request, response));

authRoutes.post('/logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            response.status(500).json({ message: "Could not log out" });
            return;
        }
        response.clearCookie('connect.sid');
        response.status(204).send();
    });
});

export { authRoutes };
