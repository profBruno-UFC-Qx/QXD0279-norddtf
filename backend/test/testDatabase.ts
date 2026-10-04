import 'dotenv/config';

export function getTestDatabase() {
  const url = process.env['TEST_DATABASE_URL'];

  if (!url) {
    throw new Error('TEST_DATABASE_URL não está definida. Os testes não rodam sem um banco de teste.');
  }

  const name = new URL(url).pathname.split('/').pop() ?? '';

  if (!/^[a-z0-9_]{1,58}_test$/.test(name)) {
    throw new Error(`TEST_DATABASE_URL aponta para "${name}". O nome precisa terminar em _test, ter no máximo 63 caracteres e usar só letras minúsculas, números e underscore. Os testes se recusam a rodar contra esse banco.`);
  }

  return { url, name };
}
