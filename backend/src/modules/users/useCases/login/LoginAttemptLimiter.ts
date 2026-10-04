const JANELA_MS = 15 * 60 * 1000;
const MAXIMO_TENTATIVAS = 5;

interface Tentativa {
  id: number;
  instante: number;
}

interface Entrada {
  tentativas: Tentativa[];
  bloqueadoAte?: number;
}

let proximoId = 0;

export class LoginAttemptLimiter {
  private readonly entradas = new Map<string, Entrada>();

  retryAfterSeconds(email: string): number {
    const bloqueadoAte = this.entradas.get(email)?.bloqueadoAte;
    if (bloqueadoAte === undefined || bloqueadoAte <= Date.now()) {
      return 0;
    }
    return Math.ceil((bloqueadoAte - Date.now()) / 1000);
  }

  registerAttempt(email: string): number {
    this.removerExpiradas();

    const agora = Date.now();
    const entrada = this.entradas.get(email) ?? { tentativas: [] };
    const tentativa = { id: ++proximoId, instante: agora };
    entrada.tentativas = [...entrada.tentativas, tentativa].slice(-MAXIMO_TENTATIVAS);
    this.entradas.set(email, entrada);

    if (this.disparaBloqueio(entrada)) {
      entrada.bloqueadoAte = agora + JANELA_MS;
    }
    return tentativa.id;
  }

  cancelAttempt(email: string, id: number): void {
    const entrada = this.entradas.get(email);
    if (!entrada) {
      return;
    }

    entrada.tentativas = entrada.tentativas.filter((tentativa) => tentativa.id !== id);
    if (!this.disparaBloqueio(entrada)) {
      delete entrada.bloqueadoAte;
    }
    if (entrada.tentativas.length === 0) {
      this.entradas.delete(email);
    }
  }

  reset(email: string): void {
    this.entradas.delete(email);
  }

  private disparaBloqueio(entrada: Entrada): boolean {
    const primeira = entrada.tentativas[0];
    const ultima = entrada.tentativas.at(-1);
    return (
      entrada.tentativas.length === MAXIMO_TENTATIVAS &&
      primeira !== undefined &&
      ultima !== undefined &&
      ultima.instante - primeira.instante <= JANELA_MS
    );
  }

  private removerExpiradas(): void {
    const agora = Date.now();
    for (const [email, entrada] of this.entradas) {
      const ultima = entrada.tentativas.at(-1)?.instante ?? 0;
      const expiraEm = Math.max(entrada.bloqueadoAte ?? 0, ultima + JANELA_MS);
      if (expiraEm <= agora) {
        this.entradas.delete(email);
      }
    }
  }
}

export const loginAttemptLimiter = new LoginAttemptLimiter();
