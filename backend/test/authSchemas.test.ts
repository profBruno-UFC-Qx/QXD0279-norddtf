import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from '../src/modules/users/schemas/authSchemas.js';

const cadastroValido = {
  nome: 'Ana Souza',
  email: 'ana@x.com',
  senha: 'senha1234',
};

describe('signupSchema', () => {
  it('aceita dados válidos', () => {
    expect(signupSchema.safeParse(cadastroValido).success).toBe(true);
  });

  it('remove espaços das pontas do nome e converte o e-mail para minúsculas sem espaços', () => {
    const resultado = signupSchema.parse({
      ...cadastroValido,
      nome: '  Ana Souza  ',
      email: '  Ana@X.com ',
    });

    expect(resultado.nome).toBe('Ana Souza');
    expect(resultado.email).toBe('ana@x.com');
  });

  it('rejeita nome vazio ou só com espaços', () => {
    expect(signupSchema.safeParse({ ...cadastroValido, nome: '' }).success).toBe(false);
    expect(signupSchema.safeParse({ ...cadastroValido, nome: '   ' }).success).toBe(false);
  });

  it('aceita nome com 120 caracteres e rejeita 121', () => {
    expect(signupSchema.safeParse({ ...cadastroValido, nome: 'a'.repeat(120) }).success).toBe(true);
    expect(signupSchema.safeParse({ ...cadastroValido, nome: 'a'.repeat(121) }).success).toBe(false);
  });

  it('conta o nome depois de remover os espaços das pontas', () => {
    expect(signupSchema.safeParse({ ...cadastroValido, nome: `  ${'a'.repeat(120)}  ` }).success).toBe(true);
  });

  it('rejeita e-mail malformado', () => {
    expect(signupSchema.safeParse({ ...cadastroValido, email: 'ana.x.com' }).success).toBe(false);
  });

  it('aceita e-mail com 254 caracteres e rejeita 255', () => {
    const local = 'a'.repeat(254 - '@x.com'.length);
    const com254 = `${local}@x.com`;

    expect(com254.length).toBe(254);
    expect(signupSchema.safeParse({ ...cadastroValido, email: com254 }).success).toBe(true);
    expect(signupSchema.safeParse({ ...cadastroValido, email: `a${com254}` }).success).toBe(false);
  });

  it('conta o e-mail depois de remover os espaços das pontas', () => {
    const local = 'a'.repeat(254 - '@x.com'.length);

    expect(signupSchema.safeParse({ ...cadastroValido, email: `  ${local}@x.com  ` }).success).toBe(true);
  });

  it.each([
    ['menos de 8 caracteres', 'senha1'],
    ['sem letra', '12345678'],
    ['sem número', 'senhadeletras'],
    ['número só como superscrito', 'senhaaaa²'],
  ])('rejeita senha com %s', (_, senha) => {
    expect(signupSchema.safeParse({ ...cadastroValido, senha }).success).toBe(false);
  });

  it('aceita senha com 8 caracteres e rejeita 7', () => {
    expect(signupSchema.safeParse({ ...cadastroValido, senha: 'abcdefg1' }).success).toBe(true);
    expect(signupSchema.safeParse({ ...cadastroValido, senha: 'abcdef1' }).success).toBe(false);
  });

  it('aceita senha com 128 caracteres e rejeita 129', () => {
    const senha128 = `a1${'b'.repeat(126)}`;

    expect(senha128.length).toBe(128);
    expect(signupSchema.safeParse({ ...cadastroValido, senha: senha128 }).success).toBe(true);
    expect(signupSchema.safeParse({ ...cadastroValido, senha: `${senha128}c` }).success).toBe(false);
  });

  it('aceita letra acentuada como letra', () => {
    expect(signupSchema.safeParse({ ...cadastroValido, senha: 'çãçã1234' }).success).toBe(true);
  });

  it('não remove espaços da senha', () => {
    const resultado = signupSchema.parse({ ...cadastroValido, senha: '  senha1234  ' });

    expect(resultado.senha).toBe('  senha1234  ');
  });

  it('descarta campo extra como tipoPerfil sem falhar', () => {
    const resultado = signupSchema.safeParse({ ...cadastroValido, tipoPerfil: 'ADMIN' });

    expect(resultado.success).toBe(true);
    expect(resultado.data).not.toHaveProperty('tipoPerfil');
  });
});

describe('loginSchema', () => {
  it('normaliza o e-mail com maiúsculas e espaços', () => {
    const resultado = loginSchema.parse({ email: '  Ana@X.com ', senha: 'qualquer' });

    expect(resultado.email).toBe('ana@x.com');
  });

  it('não aplica política de senha', () => {
    expect(loginSchema.safeParse({ email: 'ana@x.com', senha: 'x' }).success).toBe(true);
  });

  it('não valida formato de e-mail, para que e-mail malformado chegue à checagem de credenciais', () => {
    expect(loginSchema.safeParse({ email: 'nao-e-email', senha: 'x' }).success).toBe(true);
  });

  it('rejeita senha vazia e e-mail vazio', () => {
    expect(loginSchema.safeParse({ email: 'ana@x.com', senha: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: '   ', senha: 'senha1234' }).success).toBe(false);
  });

  it('descarta campo extra sem falhar', () => {
    const resultado = loginSchema.safeParse({ email: 'ana@x.com', senha: 'x', tipoPerfil: 'ADMIN' });

    expect(resultado.success).toBe(true);
    expect(resultado.data).not.toHaveProperty('tipoPerfil');
  });
});
