import type { NextFunction, Request, Response } from "express";

function requireAuth(request: Request, response: Response, next: NextFunction): void {
    if (!request.session.userId) {
        response.status(401).json({ message: "Unauthorized" });
        return;
    }
    next();
}

export { requireAuth };
