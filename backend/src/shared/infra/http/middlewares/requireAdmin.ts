import type { NextFunction, Request, Response } from "express";
import type { UsersRepository } from "../../../../modules/users/repositories/UsersRepository.js";

function requireAdmin(usersRepository: UsersRepository) {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        const user = await usersRepository.findById(request.session.userId!);

        if (!user) {
            response.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (user.tipoPerfil !== "ADMIN") {
            response.status(403).json({ code: "ACESSO_NEGADO", message: "Você não tem permissão para acessar esta área." });
            return;
        }

        next();
    };
}

export { requireAdmin };
