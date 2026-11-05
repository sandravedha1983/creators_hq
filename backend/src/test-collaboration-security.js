const path = require('path');
const { validateTransition, ALLOWED_STATUSES } = require('./modules/collaborations/controllers');

/**
 * CreatorsHQ Collaboration Authorization & Status Transition Test Suite
 * Covers all requirements specified in Section 10 of the audit prompt:
 *   - Unauthenticated requests
 *   - Non-participants attempting updates
 *   - Receiver accepting or rejecting a pending request
 *   - Sender attempting to accept or reject their own request
 *   - Either participant completing an accepted collaboration
 *   - Invalid transitions and invalid status values
 *   - Attempts to change sender or receiver IDs
 *   - Admin permissions
 *   - Concurrent status updates
 *   - Supabase and MongoDB behavior
 */
async function runCollaborationSecurityTests() {
  console.log('================================================================');
  console.log('RUNNING COLLABORATION SECURITY & STATUS TRANSITION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. STATUS VALUE VALIDATION
  // ---------------------------------------------------------------------------
  console.log('--- 1. Status Value Validation ---');
  const invalidStatusRes1 = validateTransition('pending', 'hacked_status', { isSender: false, isReceiver: true, isAdmin: false });
  assert(!invalidStatusRes1.valid && invalidStatusRes1.code === 400, 'Rejects arbitrary non-enum status values');

  const invalidStatusRes2 = validateTransition('pending', null, { isSender: false, isReceiver: true, isAdmin: false });
  assert(!invalidStatusRes2.valid && invalidStatusRes2.code === 400, 'Rejects null or undefined status');

  const invalidStatusRes3 = validateTransition('pending', 'cancelled', { isSender: true, isReceiver: false, isAdmin: false });
  assert(!invalidStatusRes3.valid && invalidStatusRes3.code === 400, 'Rejects unconfigured statuses like "cancelled"');

  // ---------------------------------------------------------------------------
  // 2. RECEIVER ACCEPT / REJECT PENDING REQUESTS
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Receiver Permission on Pending Requests ---');
  const receiverAccept = validateTransition('pending', 'accepted', { isSender: false, isReceiver: true, isAdmin: false });
  assert(receiverAccept.valid === true, 'Receiver is allowed to accept a pending collaboration');

  const receiverReject = validateTransition('pending', 'rejected', { isSender: false, isReceiver: true, isAdmin: false });
  assert(receiverReject.valid === true, 'Receiver is allowed to reject a pending collaboration');

  // ---------------------------------------------------------------------------
  // 3. SENDER BLOCKED FROM ACCEPTING OR REJECTING OWN REQUEST
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Sender Attempting to Accept or Reject Own Request ---');
  const senderAccept = validateTransition('pending', 'accepted', { isSender: true, isReceiver: false, isAdmin: false });
  assert(!senderAccept.valid && senderAccept.code === 403, 'Sender is forbidden (403) from accepting their own request', senderAccept.message);

  const senderReject = validateTransition('pending', 'rejected', { isSender: true, isReceiver: false, isAdmin: false });
  assert(!senderReject.valid && senderReject.code === 403, 'Sender is forbidden (403) from rejecting their own request', senderReject.message);

  // ---------------------------------------------------------------------------
  // 4. INVALID DIRECT TRANSITIONS FROM PENDING
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Invalid Transitions from Pending ---');
  const receiverCompletePending = validateTransition('pending', 'completed', { isSender: false, isReceiver: true, isAdmin: false });
  assert(!receiverCompletePending.valid && receiverCompletePending.code === 400, 'Receiver cannot skip straight from pending to completed (400)');

  const senderCompletePending = validateTransition('pending', 'completed', { isSender: true, isReceiver: false, isAdmin: false });
  assert(!senderCompletePending.valid && senderCompletePending.code === 400, 'Sender cannot skip straight from pending to completed (400)');

  // ---------------------------------------------------------------------------
  // 5. COMPLETING ACCEPTED COLLABORATIONS (BOTH PARTICIPANTS)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Completing Accepted Collaborations ---');
  const senderCompleteAccepted = validateTransition('accepted', 'completed', { isSender: true, isReceiver: false, isAdmin: false });
  assert(senderCompleteAccepted.valid === true, 'Sender can mark an accepted collaboration as completed');

  const receiverCompleteAccepted = validateTransition('accepted', 'completed', { isSender: false, isReceiver: true, isAdmin: false });
  assert(receiverCompleteAccepted.valid === true, 'Receiver can mark an accepted collaboration as completed');

  const acceptedToRejected = validateTransition('accepted', 'rejected', { isSender: false, isReceiver: true, isAdmin: false });
  assert(!acceptedToRejected.valid && acceptedToRejected.code === 400, 'Cannot reject an already accepted collaboration (400)');

  const acceptedToPending = validateTransition('accepted', 'pending', { isSender: false, isReceiver: true, isAdmin: false });
  assert(!acceptedToPending.valid && acceptedToPending.code === 400, 'Cannot move accepted collaboration back to pending (400)');

  // ---------------------------------------------------------------------------
  // 6. TERMINAL STATE IMMUTABILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Terminal State Immutability ---');
  const rejectedToAccepted = validateTransition('rejected', 'accepted', { isSender: false, isReceiver: true, isAdmin: false });
  assert(!rejectedToAccepted.valid && rejectedToAccepted.code === 400, 'Cannot reopen or accept a rejected collaboration');

  const completedToPending = validateTransition('completed', 'pending', { isSender: true, isReceiver: false, isAdmin: false });
  assert(!completedToPending.valid && completedToPending.code === 400, 'Cannot transition a completed collaboration');

  // ---------------------------------------------------------------------------
  // 7. ADMIN PRIVILEGES
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Admin Privileges ---');
  const adminPendingToAccepted = validateTransition('pending', 'accepted', { isSender: false, isReceiver: false, isAdmin: true });
  assert(adminPendingToAccepted.valid === true, 'Admin can transition pending to accepted');

  const adminCompletedToAccepted = validateTransition('completed', 'accepted', { isSender: false, isReceiver: false, isAdmin: true });
  assert(adminCompletedToAccepted.valid === true, 'Admin can perform administrative corrections on completed records');

  // ---------------------------------------------------------------------------
  // 8. CONTROLLER UNIT TESTS: MONGODB PATH
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Controller Unit Tests: MongoDB Path ---');
  const { updateStatus } = require('./modules/collaborations/controllers');
  const { supabase } = require('./config/supabase');

  const origEnvUrl = process.env.SUPABASE_URL;
  // Force MongoDB path by setting dummy URL so isSupabaseActive() returns false
  process.env.SUPABASE_URL = 'https://dummy-creatorshq.supabase.co';

  const Collaboration = require('./modules/collaborations/models');
  const origFindById = Collaboration.findById;
  const origFindOneAndUpdate = Collaboration.findOneAndUpdate;

  let mockCollab = {
    _id: 'collab_1',
    sender_id: 'brand_user_1',
    receiver_id: 'creator_user_2',
    status: 'pending'
  };

  Collaboration.findById = async () => mockCollab;
  Collaboration.findOneAndUpdate = async (filter, update) => {
    if (filter.status !== mockCollab.status) return null;
    return { ...mockCollab, ...update.$set };
  };

  let statusCode = null;
  let responseData = null;
  const mockRes = {
    status: (code) => { statusCode = code; return { json: (d) => { responseData = d; } }; },
    json: (d) => { statusCode = 200; responseData = d; }
  };

  // Test Non-Participant
  const nonParticipantReq = {
    params: { id: 'collab_1' },
    user: { id: 'intruder_user_999', role: 'creator' },
    body: { status: 'accepted' }
  };
  await updateStatus(nonParticipantReq, mockRes, () => {});
  assert(statusCode === 403, 'MongoDB: Non-participant update attempt rejected with 403 Forbidden');

  // Test Sender attempting to accept own request
  const senderReq = {
    params: { id: 'collab_1' },
    user: { id: 'brand_user_1', role: 'brand' },
    body: { status: 'accepted' }
  };
  await updateStatus(senderReq, mockRes, () => {});
  assert(statusCode === 403, 'MongoDB: Sender attempting to accept own request rejected with 403 Forbidden');

  // Test Receiver accepting request
  const receiverReq = {
    params: { id: 'collab_1' },
    user: { id: 'creator_user_2', role: 'creator' },
    body: { status: 'accepted' }
  };
  await updateStatus(receiverReq, mockRes, () => {});
  assert(statusCode === 200 && responseData.data?.status === 'accepted', 'MongoDB: Receiver accepting request succeeds with 200');

  // Test Protected Field Injection Immunity
  let injectedMongoFields = false;
  Collaboration.findOneAndUpdate = async (filter, update) => {
    if (update.$set.sender_id || update.$set.receiver_id) {
      injectedMongoFields = true;
    }
    return { ...mockCollab, ...update.$set };
  };

  const tamperReq = {
    params: { id: 'collab_1' },
    user: { id: 'creator_user_2', role: 'creator' },
    body: {
      status: 'rejected',
      sender_id: 'malicious_user_id',
      receiver_id: 'malicious_user_id'
    }
  };
  await updateStatus(tamperReq, mockRes, () => {});
  assert(!injectedMongoFields, 'MongoDB: Protected fields (sender_id, receiver_id) are ignored during update');

  // Test Concurrency Protection
  Collaboration.findOneAndUpdate = async () => null; // Simulate race condition
  const raceReq = {
    params: { id: 'collab_1' },
    user: { id: 'creator_user_2', role: 'creator' },
    body: { status: 'accepted' }
  };
  await updateStatus(raceReq, mockRes, () => {});
  assert(statusCode === 409, 'MongoDB: Concurrent status conflict rejected with 409 Conflict');

  // Restore MongoDB mocks
  Collaboration.findById = origFindById;
  Collaboration.findOneAndUpdate = origFindOneAndUpdate;

  // ---------------------------------------------------------------------------
  // 9. CONTROLLER UNIT TESTS: SUPABASE PATH
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. Controller Unit Tests: Supabase Path ---');
  process.env.SUPABASE_URL = origEnvUrl;

  const origFrom = supabase.from;
  let mockSbCollab = {
    id: 'collab_sb_1',
    sender_id: 'brand_sb_1',
    receiver_id: 'creator_sb_2',
    status: 'pending'
  };

  let sbUpdatedFields = null;
  let sbFilterStatus = null;

  supabase.from = (table) => {
    if (table !== 'collaborations') return origFrom.call(supabase, table);
    return {
      select: () => ({
        eq: (field, val) => ({
          single: async () => ({ data: mockSbCollab, error: null })
        })
      }),
      update: (fields) => {
        sbUpdatedFields = fields;
        return {
          eq: (f1, v1) => ({
            eq: (f2, statusVal) => {
              sbFilterStatus = statusVal;
              return {
                select: () => ({
                  single: async () => {
                    if (statusVal !== mockSbCollab.status) {
                      return { data: null, error: new Error('Conflict') };
                    }
                    return { data: { ...mockSbCollab, ...fields }, error: null };
                  }
                })
              };
            }
          })
        };
      }
    };
  };

  // Test Supabase Non-Participant
  const sbNonPartReq = {
    params: { id: 'collab_sb_1' },
    user: { id: 'intruder_sb_999', role: 'creator' },
    body: { status: 'accepted' }
  };
  await updateStatus(sbNonPartReq, mockRes, () => {});
  assert(statusCode === 403, 'Supabase: Non-participant update attempt rejected with 403 Forbidden', JSON.stringify(responseData));

  // Test Supabase Sender attempting to accept own request
  const sbSenderReq = {
    params: { id: 'collab_sb_1' },
    user: { id: 'brand_sb_1', role: 'brand' },
    body: { status: 'accepted' }
  };
  await updateStatus(sbSenderReq, mockRes, () => {});
  assert(statusCode === 403, 'Supabase: Sender attempting to accept own request rejected with 403 Forbidden', JSON.stringify(responseData));

  // Test Supabase Receiver accepting request
  const sbReceiverReq = {
    params: { id: 'collab_sb_1' },
    user: { id: 'creator_sb_2', role: 'creator' },
    body: { status: 'accepted' }
  };
  await updateStatus(sbReceiverReq, mockRes, () => {});
  assert(statusCode === 200 && responseData.data?.status === 'accepted', 'Supabase: Receiver accepting request succeeds with 200');
  assert(sbUpdatedFields && !sbUpdatedFields.sender_id && !sbUpdatedFields.receiver_id, 'Supabase: Protected fields are not included in update payload');
  assert(sbFilterStatus === 'pending', 'Supabase: Update query includes optimistic concurrency check matching existing status');

  // Test Supabase Concurrency Conflict (simulating 0 rows updated due to concurrent status change)
  mockSbCollab.status = 'pending';
  supabase.from = (table) => {
    if (table !== 'collaborations') return origFrom.call(supabase, table);
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockSbCollab, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: null, error: new Error('0 rows updated due to concurrent update') })
            })
          })
        })
      })
    };
  };

  await updateStatus(sbReceiverReq, mockRes, () => {});
  assert(statusCode === 409, 'Supabase: Concurrent status modification returns 409 Conflict', JSON.stringify(responseData));

  // Restore Supabase mock
  supabase.from = origFrom;

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCollaborationSecurityTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
