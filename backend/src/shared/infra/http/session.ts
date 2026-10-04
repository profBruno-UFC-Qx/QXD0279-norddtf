import type { Request } from "express";

export function saveSession(session: Request["session"]): Promise<void> {
    return new Promise((resolve, reject) => {
        session.save((err) => (err ? reject(err) : resolve()));
    });
}

export function regenerateSession(session: Request["session"]): Promise<void> {
    return new Promise((resolve, reject) => {
        session.regenerate((err) => (err ? reject(err) : resolve()));
    });
}
