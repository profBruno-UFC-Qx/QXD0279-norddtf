import type { Request, Response } from "express";
import type { UsersRepository } from "../../repositories/UsersRepository";

class MeController {
    constructor(private readonly usersRepository: UsersRepository) {}

    async handle(request: Request, response: Response): Promise<void> {
        const user = await this.usersRepository.findById(request.session.userId!);

        if (!user) {
            response.status(404).json({ message: "User not found" });
            return;
        }

        const { senha: _senha, ...safeUser } = user;
        response.status(200).json(safeUser);
    }
}

export { MeController };
