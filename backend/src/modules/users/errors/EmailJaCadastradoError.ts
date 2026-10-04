export class EmailJaCadastradoError extends Error {
  constructor() {
    super('E-mail já cadastrado');
    this.name = 'EmailJaCadastradoError';
  }
}
