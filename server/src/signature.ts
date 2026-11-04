import { createHash, generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { KEY_DIR, KEY_ID } from './config.js';
import { canonicalJson } from './canonical.js';

const PRIVATE_PATH = path.join(KEY_DIR, 'ed25519-private.pem');
const PUBLIC_PATH = path.join(KEY_DIR, 'ed25519-public.pem');

export interface KeyMaterial {
  keyId: string;
  privatePem: string;
  publicPem: string;
}

let cached: KeyMaterial | null = null;

export function loadOrCreateKeys(): KeyMaterial {
  if (cached) return cached;

  if (!fs.existsSync(PRIVATE_PATH) || !fs.existsSync(PUBLIC_PATH)) {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    fs.writeFileSync(PRIVATE_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    fs.writeFileSync(PUBLIC_PATH, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o644 });
  }

  cached = {
    keyId: KEY_ID,
    privatePem: fs.readFileSync(PRIVATE_PATH, 'utf8'),
    publicPem: fs.readFileSync(PUBLIC_PATH, 'utf8'),
  };
  return cached;
}

export function publicKeyB64(): string {
  const der = createPublicKey(loadOrCreateKeys().publicPem).export({ type: 'spki', format: 'der' });
  return Buffer.from(der).toString('base64url');
}

/** Sign a payload; returns base64url signature. */
export function signPayload(payload: unknown): string {
  const data = Buffer.from(canonicalJson(payload), 'utf8');
  const signature = sign(null, data, createPrivateKey(loadOrCreateKeys().privatePem));
  return signature.toString('base64url');
}

export function verifyPayload(payload: unknown, signature: string, publicPem?: string): boolean {
  const data = Buffer.from(canonicalJson(payload), 'utf8');
  const key = createPublicKey(publicPem ?? loadOrCreateKeys().publicPem);
  return verify(null, data, key, Buffer.from(signature, 'base64url'));
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
