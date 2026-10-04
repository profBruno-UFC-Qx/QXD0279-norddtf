import { Router } from "express";

const healthRoutes: Router = Router();

healthRoutes.get('/', (_req, res) => {
  res.status(200).json({ status: `backend está rodando na porta 3333 ${new Date().toLocaleString('pt-BR')}` });
});

export { healthRoutes };