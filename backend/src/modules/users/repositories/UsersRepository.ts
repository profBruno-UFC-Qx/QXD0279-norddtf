import { db } from "../../../shared/infra/prisma/db";
import type { Models } from "../../../shared/infra/prisma/schema";
import type { Scalars } from "@prisma/orm-postgres/family-contract/types";

interface GoogleProfile {
    sub: string;
    email: string;
    emailVerified: boolean;
    nome: string;
}

type UserRow = Scalars<Models.public_User>;

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
}

export { UsersRepository };
