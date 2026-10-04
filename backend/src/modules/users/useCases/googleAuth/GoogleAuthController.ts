import type { Request, Response } from "express";
import type { GoogleAuthService } from "./GoogleAuthService";
import type { UsersRepository } from "../../repositories/UsersRepository";

function saveSession(session: Request["session"]): Promise<void> {
    return new Promise((resolve, reject) => {
        session.save((err) => (err ? reject(err) : resolve()));
    });
}

function regenerateSession(session: Request["session"]): Promise<void> {
    return new Promise((resolve, reject) => {
        session.regenerate((err) => (err ? reject(err) : resolve()));
    });
}

class GoogleAuthController {
    constructor(
        private readonly googleAuthService: GoogleAuthService,
        private readonly usersRepository: UsersRepository,
    ) {}

    // auth/google
    async handle(request: Request, response: Response): Promise<void> {
        const { authUrl, state, codeVerifier } = await this.googleAuthService.generateAuthUrl();
        request.session.oauth = { state, codeVerifier };
        await saveSession(request.session);
        response.redirect(authUrl);
    }

    // auth/google/callback
    async callback(request: Request, response: Response): Promise<void> {
        const frontendUrl = process.env.FRONTEND_URL!;
        const { error } = request.query;

        if (error) {
            response.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error))}`);
            return;
        }

        try {
            const sessionOauth = request.session.oauth;
            const sessionState = sessionOauth?.state;
            const codeVerifier = sessionOauth?.codeVerifier;
            delete request.session.oauth;

            const { code, state } = request.query;

            if (state !== sessionState) {
                response.redirect(`${frontendUrl}/login?error=invalid_state`);
                return;
            }

            if (!code) {
                response.redirect(`${frontendUrl}/login?error=missing_code`);
                return;
            }

            const tokens = await this.googleAuthService.getToken(code as string, codeVerifier as string);

            if (!tokens.id_token) {
                response.redirect(`${frontendUrl}/login?error=missing_id_token`);
                return;
            }

            const { sub, email, email_verified, name } = await this.googleAuthService.verifyIdToken(tokens.id_token);

            const user = await this.usersRepository.findOrCreateByGoogleProfile({
                sub,
                email: email!,
                emailVerified: email_verified === true,
                nome: name ?? email!,
            });

            await regenerateSession(request.session);
            request.session.userId = user.id;
            await saveSession(request.session);

            response.redirect(frontendUrl);
        } catch {
            response.redirect(`${frontendUrl}/login?error=internal_error`);
        }
    }
}

export { GoogleAuthController };
