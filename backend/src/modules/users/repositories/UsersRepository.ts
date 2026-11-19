import { db } from "../../../shared/infra/prisma/db.js";
import type { Models } from "../../../shared/infra/prisma/schema";
import type { Scalars } from "@prisma/orm-postgres/family-contract/types";
import { EmailJaCadastradoError } from "../errors/EmailJaCadastradoError.js";

interface GoogleProfile {
    sub: string;
    email: string;
    emailVerified: boolean;
    nome: string;
}

type UserRow = Scalars<Models.public_User>;

interface NewUserWithPassword {
    nome: string;
    email: string;
    senhaHash: string;
    tipoPerfil?: UserRow["tipoPerfil"];
}

const EMAIL_UNIQUE_CONSTRAINT = "user_email_key";

class UsersRepository {
    async findOrCreateByGoogleProfile(profile: GoogleProfile): Promise<UserRow> {
        return db.transaction(async (tx) => {
            const bySub = await tx.orm.public.User.where({ sub: profile.sub }).first();
            if (bySub) {
                return bySub;
            }

            if (profile.emailVerified) {
                const byEmail = await tx.orm.public.User.where({ email: profile.email }).first();
                if (byEmail) {
                    const updated = await tx.orm.public.User.where({ id: byEmail.id }).update({ sub: profile.sub });
                    if (!updated) {
                        throw new Error("Failed to link Google account: user not found during update");
                    }
                    return updated;
                }
            }

            return tx.orm.public.User.create({
                sub: profile.sub,
                email: profile.email,
                nome: profile.nome,
            });
        });
    }

    async findById(id: string): Promise<UserRow | null> {
        return db.orm.public.User.first({ id });
    }

    async findEnderecoByUserId(userId: string) {
        return db.orm.public.Endereco.first({ userId });
    }

    async atualizarPerfil(id: string, nome: string, telefone: string | null) {
        return db.orm.public.User.where({ id }).update({ nome, telefone });
    }

    async upsertEndereco(userId: string, dados: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string | null;
        bairro: string;
        cidade: string;
        estado: string;
    }) {
        const existente = await db.orm.public.Endereco.first({ userId });
        if (existente) {
            return db.orm.public.Endereco.where({ userId }).update(dados);
        }
        return db.orm.public.Endereco.create({ userId, ...dados });
    }

    async findByEmail(email: string): Promise<UserRow | null> {
        return db.orm.public.User.where({ email }).first();
    }

    async createWithPassword({ nome, email, senhaHash, tipoPerfil }: NewUserWithPassword): Promise<UserRow> {
        return db.orm.public.User.create({ nome, email, senha: senhaHash, ...(tipoPerfil ? { tipoPerfil } : {}) })
            .catch(emailRepetido);
    }
}

function emailRepetido(error: unknown): never {
    if (isEmailUniqueViolation(error)) {
        throw new EmailJaCadastradoError();
    }
    throw error;
}

function isEmailUniqueViolation(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }
    const { sqlState, constraint } = error as Error & { sqlState?: string; constraint?: string };
    return sqlState === "23505" && constraint === EMAIL_UNIQUE_CONSTRAINT;
}

export { UsersRepository };
