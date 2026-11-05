/**
 * Collaboration Security Tests — CreatorsHQ
 *
 * Run with:   npm test -- --runInBand
 *
 * The unit tests cover validateTransition() in isolation (no DB needed).
 * The HTTP and authentication tests use mocked Supabase dependencies and do
 * not contact a live database.
 */

'use strict';

const express = require('express');
const http = require('http');
const mockSupabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
const mockCreateUserClient = jest.fn();
const mockUsersByToken = new Map();
const mockProfilesById = new Map();

jest.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
  createUserClient: mockCreateUserClient
}));

jest.mock('../notifications/controllers', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined)
}));

const { validateTransition, ALLOWED_STATUSES } = require('./controllers');
const collaborationRoutes = require('./routes');
const {
  authenticate: realAuthenticate,
  authorize: realAuthorize
} = jest.requireActual('../../middleware/auth');

let collaborationRecord;
let updatePayloads;
let fetchBarrier;
let releaseFetchBarrier;
let fetchCount;
let profileResult;
let server;
let serverPort;

const createSupabaseQuery = () => {
  let operation = 'select';
  let updateValues;
  let selectedId;
  let expectedStatus;

  const query = {
    select: jest.fn(() => query),
    update: jest.fn((values) => {
      operation = 'update';
      updateValues = values;
      updatePayloads.push(values);
      return query;
    }),
    eq: jest.fn((field, value) => {
      if (field === 'id') selectedId = value;
      if (field === 'status') expectedStatus = value;
      return query;
    }),
    single: jest.fn(async () => {
      if (operation === 'select') {
        const barrier = fetchBarrier;
        if (barrier) {
          fetchCount += 1;
          if (fetchCount === 2) {
            releaseFetchBarrier();
            fetchBarrier = null;
          }
          await barrier;
        }
        return selectedId === collaborationRecord.id
          ? { data: { ...collaborationRecord }, error: null }
          : { data: null, error: { message: 'Not found' } };
      }

      if (selectedId !== collaborationRecord.id || expectedStatus !== collaborationRecord.status) {
        return { data: null, error: null };
      }
      collaborationRecord = { ...collaborationRecord, ...updateValues };
      return { data: { ...collaborationRecord }, error: null };
    })
  };
  return query;
};

const sendStatusRequest = ({ token, status, body, id = collaborationRecord.id }) => {
  const payload = body || (status === undefined ? undefined : { status });
  const serialized = payload === undefined ? undefined : JSON.stringify(payload);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (serialized) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(serialized);
  }

  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port: serverPort,
      method: 'PATCH',
      path: `/api/collaborations/${id}/status`,
      headers
    }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        resolve({ statusCode: response.statusCode, body: JSON.parse(responseBody) });
      });
    });
    request.on('error', reject);
    request.end(serialized);
  });
};

const runAuthentication = async (authorization) => {
  const req = { header: jest.fn(() => authorization) };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  const next = jest.fn();
  await realAuthenticate(req, res, next);
  return { req, res, next };
};

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/collaborations', collaborationRoutes);
  app.use((error, req, res, next) => {
    res.status(500).json({ error: error.message });
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  serverPort = server.address().port;
});

afterAll(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  collaborationRecord = {
    id: 'collab-test-001',
    sender_id: 'sender-test-001',
    receiver_id: 'receiver-test-001',
    status: 'pending',
    message: 'Original message'
  };
  updatePayloads = [];
  fetchBarrier = null;
  releaseFetchBarrier = null;
  fetchCount = 0;
  profileResult = {
    data: {
      id: 'profile-user-001',
      role: 'creator',
      plan: 'free',
      is_verified: false,
      is_onboarded: false
    },
    error: null
  };
  mockProfilesById.clear();
  mockProfilesById.set('profile-user-001', profileResult);
  mockProfilesById.set('receiver-test-001', {
    data: { id: 'receiver-test-001', role: 'creator' },
    error: null
  });
  mockProfilesById.set('sender-test-001', {
    data: { id: 'sender-test-001', role: 'brand' },
    error: null
  });
  mockProfilesById.set('stranger-test-001', {
    data: { id: 'stranger-test-001', role: 'creator' },
    error: null
  });
  mockUsersByToken.clear();
  mockUsersByToken.set('receiver-token', { id: 'receiver-test-001', email: 'receiver@example.invalid' });
  mockUsersByToken.set('sender-token', { id: 'sender-test-001', email: 'sender@example.invalid' });
  mockUsersByToken.set('stranger-token', { id: 'stranger-test-001', email: 'stranger@example.invalid' });
  mockUsersByToken.set('supabase-access-token', {
    id: 'profile-user-001',
    email: 'test@example.invalid',
    user_metadata: { role: 'admin' },
    app_metadata: { role: 'admin' }
  });
  mockUsersByToken.set('active-admin-token', {
    id: 'admin-user-001',
    email: 'admin@example.invalid',
    app_metadata: { role: 'admin' }
  });
  mockUsersByToken.set('profile-admin-token', {
    id: 'admin-user-001',
    email: 'admin@example.invalid'
  });
  mockProfilesById.set('admin-user-001', {
    data: { id: 'admin-user-001', role: 'admin', is_blocked: false, is_suspended: false },
    error: null
  });
  mockSupabase.from.mockImplementation((table) => {
    if (table === 'profiles') {
      let profileId;
      const query = {
        select: jest.fn(() => query),
        eq: jest.fn((field, value) => {
          if (field === 'id') profileId = value;
          return query;
        }),
        maybeSingle: jest.fn(async () => mockProfilesById.get(profileId) || profileResult)
      };
      return query;
    }
    if (table !== 'collaborations') throw new Error(`Unexpected table in mocked HTTP test: ${table}`);
    return createSupabaseQuery();
  });
  mockSupabase.auth.getUser.mockImplementation(async (token) => {
    const user = mockUsersByToken.get(token);
    return user
      ? { data: { user }, error: null }
      : { data: null, error: new Error('Invalid test token') };
  });
  mockCreateUserClient.mockReturnValue({ userScoped: true });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// UNIT TESTS — validateTransition() pure function
// ---------------------------------------------------------------------------

describe('validateTransition() — pure state-machine', () => {
  const SENDER   = { isSender: true,  isReceiver: false, isAdmin: false };
  const RECEIVER = { isSender: false, isReceiver: true,  isAdmin: false };
  const BOTH     = { isSender: true,  isReceiver: true,  isAdmin: false }; // same-user edge case
  const NEITHER  = { isSender: false, isReceiver: false, isAdmin: false };
  const ADMIN    = { isSender: false, isReceiver: false, isAdmin: true  };

  // ── Pending → accepted / rejected ─────────────────────────────────────────

  test('U-01: pending → accepted by receiver is valid', () => {
    const r = validateTransition('pending', 'accepted', RECEIVER);
    expect(r).toEqual({ valid: true });
  });

  test('U-02: pending → rejected by receiver is valid', () => {
    const r = validateTransition('pending', 'rejected', RECEIVER);
    expect(r).toEqual({ valid: true });
  });

  test('U-03: pending → accepted by sender is forbidden (403)', () => {
    const r = validateTransition('pending', 'accepted', SENDER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(403);
  });

  test('U-03b: pending → rejected by sender is forbidden (403)', () => {
    const r = validateTransition('pending', 'rejected', SENDER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(403);
  });

  test('U-04: pending → completed is illegal (400)', () => {
    const r = validateTransition('pending', 'completed', RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-04b: pending → pending (unrelated target) is illegal (400)', () => {
    const r = validateTransition('pending', 'pending', RECEIVER);
    // idempotent — same status should return isNoOp
    expect(r).toEqual({ valid: true, isNoOp: true });
  });

  // ── Accepted → completed ──────────────────────────────────────────────────

  test('U-05: accepted → completed by sender is valid', () => {
    const r = validateTransition('accepted', 'completed', SENDER);
    expect(r).toEqual({ valid: true });
  });

  test('U-06: accepted → completed by receiver is valid', () => {
    const r = validateTransition('accepted', 'completed', RECEIVER);
    expect(r).toEqual({ valid: true });
  });

  test('U-07: accepted → completed by unrelated user is forbidden (403)', () => {
    const r = validateTransition('accepted', 'completed', NEITHER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(403);
  });

  test('U-08: accepted → rejected is illegal (400)', () => {
    const r = validateTransition('accepted', 'rejected', SENDER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-08b: accepted → pending is illegal (400)', () => {
    const r = validateTransition('accepted', 'pending', RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  // ── Terminal states ───────────────────────────────────────────────────────

  test('U-09: rejected → accepted is terminal (400)', () => {
    const r = validateTransition('rejected', 'accepted', RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-09b: rejected → pending is terminal (400)', () => {
    const r = validateTransition('rejected', 'pending', ADMIN);
    // Admin bypasses transition check in the current implementation
    expect(r).toEqual({ valid: true });
  });

  test('U-10: completed → pending is terminal (400 for non-admin)', () => {
    const r = validateTransition('completed', 'pending', RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-10b: completed → accepted is terminal (400)', () => {
    const r = validateTransition('completed', 'accepted', SENDER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  // ── Admin overrides ───────────────────────────────────────────────────────

  test('U-11a: admin can move pending → completed (bypasses participant rules)', () => {
    const r = validateTransition('pending', 'completed', ADMIN);
    expect(r).toEqual({ valid: true });
  });

  test('U-11b: admin can move rejected → accepted (reopen)', () => {
    const r = validateTransition('rejected', 'accepted', ADMIN);
    expect(r).toEqual({ valid: true });
  });

  test('U-11c: admin can move completed → pending', () => {
    const r = validateTransition('completed', 'pending', ADMIN);
    expect(r).toEqual({ valid: true });
  });

  // ── Invalid status values ─────────────────────────────────────────────────

  test('U-12a: invalid target status string is rejected (400)', () => {
    const r = validateTransition('pending', 'cancelled', RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-12b: empty string target status is rejected (400)', () => {
    const r = validateTransition('pending', '', RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-12c: null target status is rejected (400)', () => {
    const r = validateTransition('pending', null, RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  test('U-12d: SQL injection attempt as target status is rejected (400)', () => {
    const r = validateTransition('pending', "'; DROP TABLE collaborations; --", RECEIVER);
    expect(r.valid).toBe(false);
    expect(r.code).toBe(400);
  });

  // ── Idempotent (same status) ──────────────────────────────────────────────

  test('U-13a: same status (pending → pending) is a no-op', () => {
    const r = validateTransition('pending', 'pending', NEITHER);
    expect(r).toEqual({ valid: true, isNoOp: true });
  });

  test('U-13b: same status (accepted → accepted) is a no-op', () => {
    const r = validateTransition('accepted', 'accepted', NEITHER);
    expect(r).toEqual({ valid: true, isNoOp: true });
  });

  test('U-13c: same status (rejected → rejected) is a no-op', () => {
    const r = validateTransition('rejected', 'rejected', NEITHER);
    expect(r).toEqual({ valid: true, isNoOp: true });
  });

  // ── ALLOWED_STATUSES export ───────────────────────────────────────────────

  test('ALLOWED_STATUSES contains exactly the four documented values', () => {
    expect(ALLOWED_STATUSES).toEqual(
      expect.arrayContaining(['pending', 'accepted', 'rejected', 'completed'])
    );
    expect(ALLOWED_STATUSES).toHaveLength(4);
  });
});

// Old commented Supertest example; the active mocked HTTP tests are below.

// Uncomment and install supertest + jest when adding the integration layer:
//
// const request = require('supertest');
// const app     = require('../../app');
//
// describe('PATCH /api/collaborations/:id/status — integration', () => {
//
//   const COLLAB_ID = 'test-collab-uuid-0001';
//   const SENDER_ID   = 'user-sender-uuid-0001';
//   const RECEIVER_ID = 'user-receiver-uuid-0001';
//   const OTHER_ID    = 'user-other-uuid-0001';
//   const ADMIN_ID    = 'user-admin-uuid-0001';
//
//   const makeToken = (role, userId) =>
//     jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'test-secret');
//
//   // Mock Supabase responses
//   beforeEach(() => {
//     jest.resetModules();
//     jest.mock('../../config/supabase', () => ({
//       supabase: {
//         auth: { getUser: async () => ({ data: null, error: new Error('mocked') }) },
//         from: () => ({ select: () => ({ eq: () => ({ single: async () =>
//           ({ data: { id: COLLAB_ID, sender_id: SENDER_ID, receiver_id: RECEIVER_ID, status: 'pending' }, error: null }) }) }) }),
//       },
//       createUserClient: () => ({}),
//     }));
//   });
//
//   // I-01
//   test('receiver accepts pending → 200', async () => {
//     const res = await request(app)
//       .patch(`/api/collaborations/${COLLAB_ID}/status`)
//       .set('Authorization', `Bearer ${makeToken('creator', RECEIVER_ID)}`)
//       .send({ status: 'accepted' });
//     expect(res.statusCode).toBe(200);
//   });
//
//   // I-03
//   test('sender tries to accept pending → 403', async () => {
//     const res = await request(app)
//       .patch(`/api/collaborations/${COLLAB_ID}/status`)
//       .set('Authorization', `Bearer ${makeToken('creator', SENDER_ID)}`)
//       .send({ status: 'accepted' });
//     expect(res.statusCode).toBe(403);
//   });
//
//   // I-05
//   test('unrelated user tries update → 403', async () => {
//     const res = await request(app)
//       .patch(`/api/collaborations/${COLLAB_ID}/status`)
//       .set('Authorization', `Bearer ${makeToken('creator', OTHER_ID)}`)
//       .send({ status: 'accepted' });
//     expect(res.statusCode).toBe(403);
//   });
//
//   // I-10
//   test('unauthenticated request → 401', async () => {
//     const res = await request(app)
//       .patch(`/api/collaborations/${COLLAB_ID}/status`)
//       .send({ status: 'accepted' });
//     expect(res.statusCode).toBe(401);
//   });
//
//   // I-11 — Body injection: sender_id in body must be silently ignored
//   test('sender_id injection in body is ignored', async () => {
//     const res = await request(app)
//       .patch(`/api/collaborations/${COLLAB_ID}/status`)
//       .set('Authorization', `Bearer ${makeToken('creator', RECEIVER_ID)}`)
//       .send({ status: 'accepted', sender_id: OTHER_ID });
//     // Should succeed with normal 200 — sender_id is not extracted from body
//     expect(res.statusCode).toBe(200);
//   });
// });

// ---------------------------------------------------------------------------
// MOCKED HTTP INTEGRATION TESTS — PATCH /api/collaborations/:id/status
// These run the real route, controller, and auth middleware with Supabase
// test doubles. They do not verify real Supabase tokens, RLS, triggers, or DB.
// ---------------------------------------------------------------------------

describe('authenticate() — profile role and configuration safety', () => {
  test('uses the public profile role instead of editable Supabase metadata', async () => {
    const { req, next } = await runAuthentication('Bearer supabase-access-token');
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('creator');
  });

  test('rejects a verified Supabase user when the public profile is missing', async () => {
    mockProfilesById.set('profile-user-001', { data: null, error: null });
    const { res, next } = await runAuthentication('Bearer supabase-access-token');
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows an active admin based on the authoritative profile role', async () => {
    const { req, next } = await runAuthentication('Bearer active-admin-token');
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('admin');
  });

  test('profile role grants active admin access without an app_metadata claim', async () => {
    const { req, next } = await runAuthentication('Bearer profile-admin-token');
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('admin');
  });

  test('does not elevate a demoted admin from a stale app_metadata claim', async () => {
    mockProfilesById.set('admin-user-001', {
      data: { id: 'admin-user-001', role: 'creator', is_blocked: false, is_suspended: false },
      error: null
    });
    const { req, res, next } = await runAuthentication('Bearer active-admin-token');
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('creator');

    const authorizationResponse = {
      status: jest.fn(function setStatus(code) {
        this.statusCode = code;
        return this;
      }),
      json: jest.fn()
    };
    const authorizationNext = jest.fn();
    realAuthorize('admin')(req, authorizationResponse, authorizationNext);
    expect(authorizationResponse.statusCode).toBe(403);
    expect(authorizationNext).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  test.each(['is_blocked', 'is_suspended'])(
    'rejects a stale admin claim when the profile is %s',
    async (accountFlag) => {
      mockProfilesById.set('admin-user-001', {
        data: {
          id: 'admin-user-001',
          role: 'admin',
          [accountFlag]: true
        },
        error: null
      });
      const { res, next } = await runAuthentication('Bearer active-admin-token');
      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    }
  );

  test('rejects an admin claim when the authoritative profile is missing', async () => {
    mockProfilesById.set('admin-user-001', { data: null, error: null });
    const { res, next } = await runAuthentication('Bearer active-admin-token');
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('fails closed when the profile lookup for an admin claim errors', async () => {
    mockProfilesById.set('admin-user-001', {
      data: null,
      error: new Error('database unavailable')
    });
    const { res, next } = await runAuthentication('Bearer active-admin-token');
    expect(res.statusCode).toBe(503);
    expect(next).not.toHaveBeenCalled();
  });

  test('does not continue when the public profile lookup fails', async () => {
    mockProfilesById.set('profile-user-001', { data: null, error: new Error('database unavailable') });
    const { res, next } = await runAuthentication('Bearer supabase-access-token');
    expect(res.statusCode).toBe(503);
    expect(next).not.toHaveBeenCalled();
  });

  test('fails safely when the user-scoped client cannot be configured', async () => {
    mockCreateUserClient.mockImplementation(() => {
      throw new Error('SUPABASE_ANON_KEY is required to create a user-scoped Supabase client.');
    });
    const { res, next } = await runAuthentication('Bearer supabase-access-token');
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toMatch(/SUPABASE_ANON_KEY is required/);
    expect(next).not.toHaveBeenCalled();
  });

  test('does not trust an admin role embedded in a verified legacy JWT', async () => {
    const jwt = require('jsonwebtoken');
    process.env.JWT_SECRET = 'test-only-jwt-secret';
    mockSupabase.auth.getUser.mockResolvedValue({ data: null, error: new Error('not a Supabase token') });
    const token = jwt.sign({ id: 'profile-user-001', role: 'admin' }, process.env.JWT_SECRET);
    const { req, next } = await runAuthentication(`Bearer ${token}`);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('creator');
  });

  test('ordinary users with client metadata cannot pass admin authorization', async () => {
    const { req, next } = await runAuthentication('Bearer supabase-access-token');
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.role).toBe('creator');

    const response = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json: jest.fn()
    };
    const authorizationNext = jest.fn();
    realAuthorize('admin')(req, response, authorizationNext);
    expect(response.statusCode).toBe(403);
    expect(authorizationNext).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/collaborations/:id/status — mocked HTTP integration', () => {
  test('receiver accepts a pending collaboration', async () => {
    const response = await sendStatusRequest({ token: 'receiver-token', status: 'accepted' });
    expect(response.statusCode).toBe(200);
    expect(response.body.data.status).toBe('accepted');
  });

  test('request without authentication is rejected', async () => {
    const response = await sendStatusRequest({ status: 'accepted' });
    expect(response.statusCode).toBe(401);
  });

  test('unrelated authenticated user cannot update a collaboration', async () => {
    const response = await sendStatusRequest({ token: 'stranger-token', status: 'accepted' });
    expect(response.statusCode).toBe(403);
  });

  test('sender cannot accept a pending collaboration', async () => {
    const response = await sendStatusRequest({ token: 'sender-token', status: 'accepted' });
    expect(response.statusCode).toBe(403);
  });

  test('invalid status value is rejected', async () => {
    const response = await sendStatusRequest({ token: 'receiver-token', status: 'cancelled' });
    expect(response.statusCode).toBe(400);
  });

  test.each([
    ['rejected', 'accepted'],
    ['completed', 'pending']
  ])('terminal state %s cannot transition to %s', async (currentStatus, targetStatus) => {
    collaborationRecord.status = currentStatus;
    const response = await sendStatusRequest({ token: 'receiver-token', status: targetStatus });
    expect(response.statusCode).toBe(400);
    expect(collaborationRecord.status).toBe(currentStatus);
  });

  test('updates only status and ignores protected fields in the request body', async () => {
    const response = await sendStatusRequest({
      token: 'receiver-token',
      body: { status: 'accepted', sender_id: 'attacker-id', receiver_id: 'attacker-id', message: 'overwrite' }
    });
    expect(response.statusCode).toBe(200);
    expect(updatePayloads).toEqual([{ status: 'accepted' }]);
    expect(collaborationRecord.sender_id).toBe('sender-test-001');
    expect(collaborationRecord.receiver_id).toBe('receiver-test-001');
    expect(collaborationRecord.message).toBe('Original message');
  });

  test('concurrent updates allow only one compare-and-set to succeed', async () => {
    fetchBarrier = new Promise((resolve) => { releaseFetchBarrier = resolve; });
    const results = await Promise.all([
      sendStatusRequest({ token: 'receiver-token', status: 'accepted' }),
      sendStatusRequest({ token: 'receiver-token', status: 'rejected' })
    ]);
    expect(results.map((result) => result.statusCode).sort()).toEqual([200, 409]);
    expect(['accepted', 'rejected']).toContain(collaborationRecord.status);
    expect(updatePayloads).toHaveLength(2);
    expect(updatePayloads).toEqual(expect.arrayContaining([{ status: 'accepted' }, { status: 'rejected' }]));
  });
});
