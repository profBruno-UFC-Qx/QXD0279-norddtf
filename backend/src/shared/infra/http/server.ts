import 'dotenv/config';
import { app } from "./app.js";

const porta = Number(process.env.PORT || 3333);

app.listen(porta, (erro) => {
  if (erro) throw erro;
  console.log(`isso nao é vibecoding, servidor ta rodando na porta ${porta}`);
});