import 'server-only';

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  return 'scrypt$' + salt.toString('hex') + '$' + key.toString('hex');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = encodedHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    !saltHex ||
    !keyHex ||
    !/^[a-f0-9]{32}$/i.test(saltHex) ||
    !/^[a-f0-9]{128}$/i.test(keyHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  const actualKey = await deriveKey(password, salt);

  return timingSafeEqual(actualKey, expectedKey);
}

export async function burnPasswordWork(password: string): Promise<void> {
  await deriveKey(password, Buffer.alloc(SALT_LENGTH));
}
