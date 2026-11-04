import Fastify from 'fastify';
import { randomBytes } from 'node:crypto';
import { all, get, run } from './db.js';
import { ADMIN_TOKEN, FORMAT_VERSION, HOST, PORT } from './config.js';
import { latestSnapshot, createSnapshot } from './snapshot.js';
import { publicKeyB64 } from './signature.js';
import { runTick } from './tick.js';
import { worldStats } from './seed.js';

const DECISION_KINDS = new Set(['military', 'economic', 'diplomatic', 'internal']);
const REVIEW_STATUSES = new Set(['approved', 'rejected']);

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

function isAdmin(token: unknown): boolean {
  return typeof token === 'string' && token === ADMIN_TOKEN;
}

export function buildServer() {
  const app = Fastify({ logger: true });

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
      stats: worldStats(),
    };
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

    reply.code(201);
    return { id: decisionId, status: 'pending', gameTime };
  });

  app.post('/api/ndsv', async (request, reply) => {
    const body = request.body as {
      playerId?: string;
      stateId?: string;
      gameTime?: string;
      signature?: string;
      decisions?: Array<{ kind?: string; action?: string; payload?: unknown; gameTime?: string }>;
    };

    if (!body?.playerId || !body?.stateId || !Array.isArray(body.decisions) || body.decisions.length === 0) {
      reply.code(400);
      return { error: 'missing_fields', required: ['playerId', 'stateId', 'decisions[]'] };
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

    reply.code(201);
    return { imported: imported.length, ids: imported, status: 'pending_human_review' };
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
    run(
      'UPDATE decisions SET status = ?, note = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?',
      body.status,
      body.note ?? null,
      body.reviewer ?? 'admin',
      Date.now(),
      decisionId,
    );
    return { id: decisionId, status: body.status };
  });

  app.post('/api/console/tick', async (request, reply) => {
    if (!isAdmin(request.headers['x-admin-token'])) {
      reply.code(401);
      return { error: 'unauthorized' };
    }
    const result = runTick();
    return { gameTime: result.gameTime, daysAdvanced: result.daysAdvanced, snapshot: result.snapshot };
  });

  app.post('/api/console/snapshot', async (request, reply) => {
    if (!isAdmin(request.headers['x-admin-token'])) {
      reply.code(401);
      return { error: 'unauthorized' };
    }
    return createSnapshot();
  });

  return app;
}

export async function startServer() {
  const app = buildServer();
  await app.listen({ port: PORT, host: HOST });
  return app;
}
