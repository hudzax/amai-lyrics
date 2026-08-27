import SparkMD5 from 'spark-md5';

export function md5(input: string): string {
  return SparkMD5.hash(input);
}

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE62_MAP: Map<string, number> = new Map([...BASE62_CHARS].map((c, i) => [c, i] as const));

export function spotifyHex(base62: string): string {
  let num = BigInt(0);
  for (const char of base62) {
    const index = BASE62_MAP.get(char);
    if (index === undefined) throw new Error(`Invalid character in base62 string: ${char}`);
    num = num * BigInt(62) + BigInt(index);
  }
  return num.toString(16).padStart(32, '0');
}
