type StatusDoCluster = {
  layoutVersion: number;
  nodes: { id: string; role: unknown }[];
};

type Chave = { secretAccessKey: string | null };

type Bucket = { id: string };

const accessKeyId = process.env['S3_ACCESS_KEY_ID']!;
const secretAccessKey = process.env['S3_SECRET_ACCESS_KEY']!;
const buckets = [process.env['S3_BUCKET']!, process.env['S3_BUCKET_TEST']].filter((bucket): bucket is string => Boolean(bucket));

async function chamar(operacao: string, corpo?: unknown) {
  const resposta = await fetch(`http://garage:3903/v2/${operacao}`, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${process.env['GARAGE_ADMIN_TOKEN']!}`,
      'Content-Type': 'application/json',
    },
    body: corpo === undefined ? null : JSON.stringify(corpo),
    signal: AbortSignal.timeout(10_000),
  }).catch((erro: unknown) => {
    throw new Error(`O Garage não respondeu em ${operacao}.`, { cause: erro });
  });

  if (resposta.status === 404 && corpo === undefined) {
    return null;
  }
  if (!resposta.ok) {
    throw new Error(`O Garage respondeu ${resposta.status} em ${operacao}: ${await resposta.text()}`);
  }
  return resposta.json() as Promise<unknown>;
}

try {
  const status = (await chamar('GetClusterStatus')) as StatusDoCluster;
  const semPapel = status.nodes.filter((no) => !no.role);
  if (semPapel.length > 0) {
    await chamar('UpdateClusterLayout', {
      roles: semPapel.map(({ id }) => ({ id, zone: 'dc1', capacity: 1_000_000_000, tags: [] })),
    });
    await chamar('ApplyClusterLayout', { version: status.layoutVersion + 1 });
  }

  const chave = (await chamar(`GetKeyInfo?${new URLSearchParams({ id: accessKeyId, showSecretKey: 'true' })}`)) as Chave | null;
  if (!chave) {
    await chamar('ImportKey', { accessKeyId, secretAccessKey, name: 'nordtf' });
  } else if (chave.secretAccessKey !== secretAccessKey) {
    throw new Error('A chave S3_ACCESS_KEY_ID já existe no Garage com outro segredo. Volte o S3_SECRET_ACCESS_KEY antigo no Infisical ou no .env. Se ele se perdeu, gere um S3_ACCESS_KEY_ID novo, porque o Garage não aceita importar de novo o ID de uma chave apagada.');
  }

  for (const globalAlias of buckets) {
    const bucket = ((await chamar(`GetBucketInfo?${new URLSearchParams({ globalAlias })}`))
      ?? (await chamar('CreateBucket', { globalAlias }))) as Bucket;
    await chamar('AllowBucketKey', {
      bucketId: bucket.id,
      accessKeyId,
      permissions: { read: true, write: true, owner: true },
    });
  }

  console.log(`Garage pronto: buckets ${buckets.join(' e ')} com a chave nordtf.`);
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : erro);
  if (erro instanceof Error && erro.cause) {
    console.error(erro.cause);
  }
  process.exitCode = 1;
}
