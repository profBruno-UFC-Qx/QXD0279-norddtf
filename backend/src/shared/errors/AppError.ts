export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly detalhes: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = new.target.name;
  }
}
