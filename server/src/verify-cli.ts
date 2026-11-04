import fs from 'node:fs';
import { verifyPayload } from './signature.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: npm run verify -- path/to/SAR.json');
  process.exit(2);
}

const body = JSON.parse(fs.readFileSync(file, 'utf8')) as {
  meta: { signature?: string; [key: string]: unknown };
  [key: string]: unknown;
};

const { signature, ...meta } = body.meta;
if (!signature) {
  console.error(JSON.stringify({ ok: false, error: 'missing_signature' }));
  process.exit(1);
}

const payload = { ...body, meta };
const ok = verifyPayload(payload, signature);
console.log(
  JSON.stringify(
    {
      ok,
      snapshotId: meta.snapshotId,
      keyId: meta.keyId,
      gameTime: meta.gameTime,
      version: meta.version,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
