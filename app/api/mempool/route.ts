import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

// ── Point this to your self-hosted backend ───────────────────────────────────
// Set MEMPOOL_API_URL in .env.local, e.g.:
//   MEMPOOL_API_URL=http://localhost:8000

const BASE = (process.env.MEMPOOL_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_KEY = process.env.MEMPOOL_API_KEY;

function opaqueId(value: unknown) {
  if (typeof value !== 'string' || !value) return null;
  return createHash('sha256').update(`tsn-public:${value}`).digest('hex').slice(0, 16);
}

function redactIntent(intent: any) {
  if (!intent || typeof intent !== 'object') return intent;
  return {
    ...intent,
    id: opaqueId(intent.id),
    paymentId: opaqueId(intent.paymentId),
    recipientHash: null,
    assignedCrankerPubkey: null,
    escrowTxSig: null,
    claimTxSig: null,
    proofTxSig: null,
  };
}

async function fetchGET(path: string) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'GET',
      next: { revalidate: 3 },
      headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function redactClaim(claim: any) {
  if (!claim || typeof claim !== 'object') return claim;
  return {
    ...claim,
    id: opaqueId(claim.id),
    paymentId: opaqueId(claim.paymentId),
    intentId: opaqueId(claim.intentId),
    recipientHash: null,
    assignedCrankerPubkey: null,
    destinationWallet: null,
    destinationRoute: 'private',
  };
}

function redactWorkItem(work: any) {
  if (!work || typeof work !== 'object') return work;
  return {
    ...work,
    intent: redactIntent(work.intent),
    claimRequest: redactClaim(work.claimRequest),
  };
}

function redactProof(proof: any) {
  if (!proof || typeof proof !== 'object') return proof;
  return {
    ...proof,
    intent_id: opaqueId(proof.intent_id),
    proof_tx: null,
    cranker_pubkey: null,
    crankerRoute: 'private',
  };
}

export async function GET() {
  const [epoch, intents, claims, proofs, work, metrics, network] = await Promise.all([
    fetchGET('/epoch/status'),
    fetchGET('/intents'),
    fetchGET('/claim-requests'),
    fetchGET('/proofs'),
    fetchGET('/work'),
    fetchGET('/metrics'),
    fetchGET('/network/overview'),
  ]);

  return NextResponse.json({
    epoch:      epoch  ?? null,
    intents:    Array.isArray(intents) ? intents.map(redactIntent) : [],
    claims:     Array.isArray(claims)  ? claims.map(redactClaim) : [],
    proofs:     Array.isArray(proofs)  ? proofs.map(redactProof) : [],
    work:       Array.isArray(work)    ? work.map(redactWorkItem) : [],
    metrics:    metrics ?? null,
    network:    network ?? null,
    fetched_at: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=2, stale-while-revalidate=5',
    },
  });
}
