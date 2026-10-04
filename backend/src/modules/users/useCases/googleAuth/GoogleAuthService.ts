import { Auth } from "googleapis";
import { generateAuthState } from "../../../../shared/utils/generateAuthState";
import { oauthScopes } from "./constants";

class GoogleAuthService {
    constructor(private readonly oauth2Client: Auth.OAuth2Client) {}
    async generateAuthUrl() {
        const state = generateAuthState();
        const { codeVerifier, codeChallenge } = await this.oauth2Client.generateCodeVerifierAsync();

        const authUrl = this.oauth2Client.generateAuthUrl({
            scope: oauthScopes,
            state,
            code_challenge: codeChallenge!,
            code_challenge_method: Auth.CodeChallengeMethod.S256,
            prompt: "select_account",
            });

        return { authUrl, state, codeVerifier };
    }

    async getToken(code: string, codeVerifier: string) {
        const { tokens } = await this.oauth2Client.getToken({ code, codeVerifier });
        return tokens;
    }

    async verifyIdToken(idToken: string) {
        const ticket = await this.oauth2Client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID!,
        });
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email) {
            throw new Error("Invalid ID token: missing subject or email claim");
        }
        return payload;
    }

}


export { GoogleAuthService };