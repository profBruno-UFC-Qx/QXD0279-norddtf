import { randomBytes } from "node:crypto";

export function generateAuthState(){
    return randomBytes(32).toString("hex");
}