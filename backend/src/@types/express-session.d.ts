import "express-session";

declare module "express-session" {
  interface SessionData {
    oauth?: { state: string; codeVerifier: string };
    userId?: string;
  }
}

