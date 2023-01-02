import { randomFillSync } from 'crypto';

const alphabet =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let pointer = 0;

export const hash = (size = 6): string => {
  const buf = Buffer.allocUnsafe(size);
  randomFillSync(buf);
  let hash = '';
  for (const byte of buf) {
    pointer = (pointer + byte) % alphabet.length;
    hash += alphabet[pointer];
  }

  return hash;
};
