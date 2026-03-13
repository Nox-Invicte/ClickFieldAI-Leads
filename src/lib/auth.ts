import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Re-export JWT utilities (edge-safe)
export { signToken, verifyToken, type JWTPayload } from './auth-edge';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split('.');
  const buf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(buf, suppliedBuf);
}
