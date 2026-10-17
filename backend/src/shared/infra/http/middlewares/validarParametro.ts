import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import type { AppError } from "../../../errors/AppError.js";

function validarParametro(schema: z.ZodType, erroSeInvalido: () => AppError) {
    return (_request: Request, _response: Response, next: NextFunction, valor: string): void => {
        if (!schema.safeParse(valor).success) {
            next(erroSeInvalido());
            return;
        }
        next();
    };
}

export { validarParametro };
