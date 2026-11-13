interface TipoDeImagem {
  mime: string;
  extensao: 'png' | 'jpg' | 'webp';
}

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];

function comecaCom(buffer: Buffer, bytes: number[], inicio = 0) {
  return bytes.every((byte, indice) => buffer[inicio + indice] === byte);
}

function ehWebp(buffer: Buffer) {
  return buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP';
}

export function detectarTipoDeImagem(buffer: Buffer): TipoDeImagem | null {
  if (comecaCom(buffer, PNG)) {
    return { mime: 'image/png', extensao: 'png' };
  }
  if (comecaCom(buffer, JPEG)) {
    return { mime: 'image/jpeg', extensao: 'jpg' };
  }
  if (ehWebp(buffer)) {
    return { mime: 'image/webp', extensao: 'webp' };
  }
  return null;
}
