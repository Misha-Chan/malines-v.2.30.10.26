import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { all, get, run } from './db.js';
import { ADMIN_TOKEN, FORMAT_VERSION, HOST, PORT, SERVER_ROOT } from './config.js';
import { latestSnapshot, createSnapshot } from './snapshot.js';
import { publicKeyB64 } from './signature.js';
import { runTick } from './tick.js';
import { worldStats } from './seed.js';
import { addClient, broadcast, clientCount, removeClient } from './live.js';
import { applyDecision, type DecisionRow } from './effects.js';
import { rememberKey, verifyNdsv } from './ndsv.js';

const DECISION_KINDS = new Set(['military', 'economic', 'diplomatic', 'internal']);
const REVIEW_STATUSES = new Set(['approved', 'rejected']);

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

function isAdmin(token: unknown): boolean {
  return typeof token === 'string' && token === ADMIN_TOKEN;
}

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(websocket);

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Headers', 'content-type, x-admin-token');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (request.method === 'OPTIONS') reply.code(204).send();
  });

  app.get('/api/health', async () => {
    const game = get<{ game_time: string }>('SELECT game_time FROM game WHERE id = 1');
    return {
      ok: true,
      version: FORMAT_VERSION,
      gameTime: game?.game_time ?? null,
      clients: clientCount(),
      stats: worldStats(),
    };
  });

  const consoleFile = path.join(SERVER_ROOT, 'public', 'console.html');
  const consoleHtml = fs.existsSync(consoleFile)
    ? fs.readFileSync(consoleFile, 'utf8')
    : '<html dir="rtl"><body style="background:#050505;color:#d4af37;font-family:sans-serif">لوحة الإدارة غير مثبتة.</body></html>';

  app.get('/console', async (_request, reply) => reply.type('text/html; charset=utf-8').send(consoleHtml));
  app.get('/', async (_request, reply) => reply.redirect('/console'));

  app.get('/ws', { websocket: true }, (socket) => {
    addClient(socket);
    const game = get<{ game_time: string }>('SELECT game_time FROM game WHERE id = 1');
    socket.send(
      JSON.stringify({
        type: 'hello',
        at: Date.now(),
        payload: { gameTime: game?.game_time ?? null, clients: clientCount(), version: FORMAT_VERSION },
      }),
    );
    socket.on('close', () => removeClient(socket));
  });

  app.get('/api/key', async () => ({
    keyId: 'mln-dev-1',
    algorithm: 'ed25519',
    publicKey: publicKeyB64(),
  }));

  app.get('/api/sar/meta', async (_request, reply) => {
    const latest = latestSnapshot();
    if (!latest) {
      reply.code(404);
      return { error: 'no_snapshot' };
    }
    return {
      id: latest.summary.id,
      sha256: latest.summary.sha256,
      signature: latest.summary.signature,
      gameTime: latest.summary.gameTime,
      createdAt: latest.summary.createdAt,
      verifiedBy: 'ed25519',
      keyId: 'mln-dev-1',
    };
  });

  app.get('/api/sar', async (_request, reply) => {
    const latest = latestSnapshot();
    if (!latest) {
      reply.code(404);
      return { error: 'no_snapshot' };
    }
    reply.header('Content-Disposition', `attachment; filename="SAR-${latest.summary.id}.json"`);
    return latest.body;
  });

  app.get('/api/states', async () =>
    all('SELECT id, name, name_ar, political_system, color, treasury, industry, agriculture, stability, legitimacy, is_npc FROM states ORDER BY name'),
  );

  app.get('/api/provinces/:provinceId', async (request, reply) => {
    const { provinceId } = request.params as { provinceId: string };
    const province = get('SELECT * FROM provinces WHERE id = ?', provinceId);
    if (!province) {
      reply.code(404);
      return { error: 'province_not_found' };
    }
    const settlements = all('SELECT * FROM settlements WHERE province_id = ?', provinceId);
    return { province, settlements };
  });

  app.post('/api/decisions', async (request, reply) => {
    const body = request.body as {
      playerId?: string;
      stateId?: string;
      kind?: string;
      action?: string;
      payload?: unknown;
      gameTime?: string;
      source?: string;
    };

    if (!body?.playerId || !body?.stateId || !body?.kind || !body?.action) {
      reply.code(400);
      return { error: 'missing_fields', required: ['playerId', 'stateId', 'kind', 'action'] };
    }
    if (!DECISION_KINDS.has(body.kind)) {
      reply.code(400);
      return { error: 'invalid_kind', allowed: [...DECISION_KINDS] };
    }

    const game = get<{ game_time: string }>('SELECT game_time FROM game WHERE id = 1');
    const gameTime = body.gameTime ?? game?.game_time ?? new Date().toISOString();
    const decisionId = id('dec');

    run(
      `INSERT INTO decisions (id, player_id, state_id, kind, action, payload, game_time, received_at, status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      decisionId,
      body.playerId,
      body.stateId,
      body.kind,
      body.action,
      JSON.stringify(body.payload ?? {}),
      gameTime,
      Date.now(),
      body.source === 'ndsv' ? 'ndsv' : 'live',
    );

    broadcast('decision', { id: decisionId, stateId: body.stateId, kind: body.kind, action: body.action, gameTime });
    reply.code(201);
    return { id: decisionId, status: 'pending', gameTime };
  });

  app.post('/api/ndsv', async (request, reply) => {
    const body = request.body as {
      playerId?: string;
      stateId?: string;
      gameTime?: string;
      signature?: string;
      publicKey?: string;
      keyId?: string;
      algorithm?: string;
      decisions?: Array<{ kind?: string; action?: string; payload?: unknown; gameTime?: string }>;
    };

    if (!body?.playerId || !body?.stateId || !Array.isArray(body.decisions) || body.decisions.length === 0) {
      reply.code(400);
      return { error: 'missing_fields', required: ['playerId', 'stateId', 'decisions[]'] };
    }

    const verification = verifyNdsv(body as unknown as Record<string, unknown>);
    if (verification.reason && verification.reason !== 'unsigned') {
      reply.code(400);
      return { error: 'invalid_signature', reason: verification.reason };
    }
    if (verification.verified) {
      const remembered = rememberKey(body.playerId, String(body.publicKey), body.keyId);
      if (!remembered.ok) {
        reply.code(409);
        return { error: remembered.reason };
      }
    }

    const imported: string[] = [];
    for (const decision of body.decisions) {
      if (!decision.kind || !DECISION_KINDS.has(decision.kind) || !decision.action) {
        reply.code(400);
        return { error: 'invalid_decision', decision };
      }
      const decisionId = id('dec');
      run(
        `INSERT INTO decisions (id, player_id, state_id, kind, action, payload, game_time, received_at, status, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'ndsv')`,
        decisionId,
        body.playerId,
        body.stateId,
        decision.kind,
        decision.action,
        JSON.stringify(decision.payload ?? {}),
        decision.gameTime ?? body.gameTime ?? new Date().toISOString(),
        Date.now(),
      );
      imported.push(decisionId);
    }

    broadcast('ndsv', { stateId: body.stateId, imported: imported.length, verified: verification.verified });
    reply.code(201);
    return {
      imported: imported.length,
      ids: imported,
      status: 'pending_human_review',
      verified: verification.verified,
      reason: verification.reason,
      fingerprint: verification.fingerprint,
    };
  });

  app.get('/api/console/queue', async (request, reply) => {
    if (!isAdmin(request.headers['x-admin-token'])) {
      reply.code(401);
      return { error: 'unauthorized' };
    }
    const status = (request.query as { status?: string }).status ?? 'pending';
    const rows = all<Record<string, unknown>>(
      'SELECT * FROM decisions WHERE status = ? ORDER BY game_time ASC',
      status,
    );
    return rows.map((row) => {
      let payload: unknown = {};
      try {
        payload = JSON.parse(String(row.payload ?? '{}'));
      } catch {
        payload = {};
      }
      return { ...row, payload };
    });
  });

  app.post('/api/console/decisions/:decisionId/review', async (request, reply) => {
    if (!isAdmin(request.headers['x-admin-token'])) {
      reply.code(401);
      return { error: 'unauthorized' };
    }
    const { decisionId } = request.params as { decisionId: string };
    const body = request.body as { status?: string; note?: string; reviewer?: string };
    if (!body?.status || !REVIEW_STATUSES.has(body.status)) {
      reply.code(400);
      return { error: 'invalid_status', allowed: [...REVIEW_STATUSES] };
    }
    const decision = get<DecisionRow>('SELECT * FROM decisions WHERE id = ?', decisionId);
    if (!decision) {
      reply.code(404);
      return { error: 'not_found' };
    }
    const alreadyReviewed = decision.status !== 'pending';
    const notes = body.status === 'approved' && !alreadyReviewed ? applyDecision(decision) : [];
    run(
      'UPDATE decisions SET status = ?, note = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?',
      body.status,
      body.note ?? null,
      body.reviewer ?? 'admin',
      Date.now(),
      decisionId,
    );
    broadcast('review', { id: decisionId, status: body.status, reviewer: body.reviewer ?? 'admin', notes });
    return { id: decisionId, status: body.status, applied: notes.length > 0, notes };
  });

  app.post('/api/console/tick', async (request, reply) => {
    if (!isAdmin(request.headers['x-admin-token'])) {
      reply.code(401);
      return { error: 'unauthorized' };
    }
    const result = runTick();
    broadcast('tick', { gameTime: result.gameTime, snapshot: result.snapshot });
    return { gameTime: result.gameTime, daysAdvanced: result.daysAdvanced, snapshot: result.snapshot };
  });

  app.post('/api/console/snapshot', async (request, reply) => {
    if (!isAdmin(request.headers['x-admin-token'])) {
      reply.code(401);
      return { error: 'unauthorized' };
    }
    const snapshot = createSnapshot();
    broadcast('snapshot', snapshot);
    return snapshot;
  });

  return app;
}

export async function startServer() {
  const app = await buildServer();
  await app.listen({ port: PORT, host: HOST });
  return app;
}
