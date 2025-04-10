import SparkMD5 from 'spark-md5';

export function md5(input: string): string {
  return SparkMD5.hash(input);
}

export function spotifyHex(base62: string): string {
  const base62chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let num = BigInt(0);
  for (const char of base62) {
    const index = base62chars.indexOf(char);
    if (index === -1) throw new Error('Invalid character in base62 string');
    num = num * BigInt(62) + BigInt(index);
  }
  return num.toString(16).padStart(32, '0');
}
