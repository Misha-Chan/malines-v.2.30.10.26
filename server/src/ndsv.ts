import { createHash, verify as cryptoVerify } from 'node:crypto';
import { canonicalJson } from './canonical.js';
import { get, run } from './db.js';

export const NDSV_ALGORITHM = 'ECDSA-P256-SHA256';

const SIGNATURE_FIELDS = new Set(['signature', 'publicKey', 'keyId', 'algorithm']);

/** Everything except the signature envelope is covered by the signature. */
export function ndsvPayload(body: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!SIGNATURE_FIELDS.has(key)) payload[key] = value;
  }
  return payload;
}

export function keyFingerprint(publicKeyB64: string): string {
  return createHash('sha256').update(publicKeyB64).digest('hex').slice(0, 16);
}

export interface Verification {
  verified: boolean;
  reason?: string;
  fingerprint?: string;
}

export function verifyNdsv(body: Record<string, unknown>): Verification {
  const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
  if (!signature) return { verified: false, reason: 'unsigned' };
  const algorithm = typeof body.algorithm === 'string' ? body.algorithm : NDSV_ALGORITHM;
  if (algorithm !== NDSV_ALGORITHM) return { verified: false, reason: 'unsupported_algorithm' };
  const publicKey = typeof body.publicKey === 'string' ? body.publicKey.trim() : '';
  if (!publicKey) return { verified: false, reason: 'missing_public_key' };

  let key: Buffer;
  try {
    key = Buffer.from(publicKey, 'base64');
  } catch {
    return { verified: false, reason: 'invalid_key' };
  }
  if (key.length === 0) return { verified: false, reason: 'invalid_key' };

  const payload = canonicalJson(ndsvPayload(body));
  try {
    const ok = cryptoVerify(
      'sha256',
      Buffer.from(payload, 'utf8'),
      { key, format: 'der', type: 'spki' },
      Buffer.from(signature, 'base64'),
    );
    return { verified: ok, reason: ok ? undefined : 'bad_signature', fingerprint: keyFingerprint(publicKey) };
  } catch {
    return { verified: false, reason: 'invalid_key' };
  }
}

/**
 * Trust-on-first-use: the first verified key for a player is stored and every
 * later snapshot from that player must use the same key.
 */
export function rememberKey(playerId: string, publicKeyB64: string, keyId?: string): { ok: boolean; reason?: string } {
  const fingerprint = keyFingerprint(publicKeyB64);
  const existing = get<{ fingerprint: string }>('SELECT fingerprint FROM player_keys WHERE player_id = ?', playerId);
  if (existing && existing.fingerprint !== fingerprint) return { ok: false, reason: 'key_mismatch' };
  if (!existing) {
    run(
      'INSERT INTO player_keys (player_id, fingerprint, public_key, key_id, algorithm, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      playerId,
      fingerprint,
      publicKeyB64,
      keyId ?? null,
      NDSV_ALGORITHM,
      Date.now(),
    );
  }
  return { ok: true };
}
