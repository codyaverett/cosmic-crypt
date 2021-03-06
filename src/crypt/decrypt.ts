import * as crypto from 'crypto';

import {
  deriveKey,
  deriveKeySync,
  ENCRYPT_ALGORITHM,
  HMAC_ALGORITHM,
  MARKER,
  unpack,

  // VERSION
} from '../utility';

export enum DecryptErrorCode {
  AUTHENTICATION_ERROR
}

export async function decrypt(buffer: Buffer, password: Buffer): Promise<Buffer> {
  const data = unpack(buffer);

  const roundsBuffer = Buffer.from(data.rounds.toString(), 'hex');
  const rounds = roundsBuffer.readInt32LE(0);

  const keyInfo = await deriveKey(password, Buffer.from(data.salt.toString(), 'hex'), rounds);

  const hmac = crypto.createHmac(HMAC_ALGORITHM, keyInfo.hmacKey);

  hmac.update(MARKER);
  hmac.update(data.rounds);
  hmac.update(data.encrypted);
  hmac.update(data.iv);
  hmac.update(data.salt);

  const digest = Buffer.from(hmac.digest('hex'));

  if (!crypto.timingSafeEqual(data.hmac, digest)) {
    throw { code: DecryptErrorCode.AUTHENTICATION_ERROR, message: 'Decrypt Authentication Error' };
  }

  const cipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, keyInfo.derivedKey, Buffer.from(data.iv.toString(), 'hex'));

  const deciphered = Buffer.from([
    cipher.update(data.encrypted.toString(), 'hex', 'binary'),
    cipher.final('binary')
  ].join(''));

  return deciphered;
}

export function decryptSync(buffer: Buffer, password: Buffer): Buffer {
  const data = unpack(buffer);

  const roundsBuffer = Buffer.from(data.rounds.toString(), 'hex');
  const rounds = roundsBuffer.readInt32LE(0);

  const keyInfo = deriveKeySync(password, Buffer.from(data.salt.toString(), 'hex'), rounds);

  const hmac = crypto.createHmac(HMAC_ALGORITHM, keyInfo.hmacKey);

  hmac.update(MARKER);
  hmac.update(data.rounds);
  hmac.update(data.encrypted);
  hmac.update(data.iv);
  hmac.update(data.salt);

  const digest = Buffer.from(hmac.digest('hex'));

  if (!crypto.timingSafeEqual(data.hmac, digest)) {
    throw { code: DecryptErrorCode.AUTHENTICATION_ERROR, message: 'Decrypt Authentication Error' };
  }

  const cipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, keyInfo.derivedKey, Buffer.from(data.iv.toString(), 'hex'));

  const deciphered = Buffer.from([
    cipher.update(data.encrypted.toString(), 'hex', 'binary'),
    cipher.final('binary')
  ].join(''));

  return deciphered;
}
