import express, { type Express } from 'express';
import { routes } from './routes/index.js';
import session from 'express-session';
import cors from 'cors';

const app: Express = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 15,
    },
}));
app.use(routes);

app.get('/', (_req, res) => {
  res.send('isso nao é vibecoding, servidor ta rodando na porta 3333!');
});

export { app };