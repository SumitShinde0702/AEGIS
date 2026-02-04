export enum AgentStatus {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  AUDITING = 'AUDITING',
  SETTLING = 'SETTLING',
  SLASHED = 'SLASHED'
}

export enum AuditVerdict {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  HALLUCINATION_DETECTED = 'HALLUCINATION_DETECTED',
  LAZY_REASONING = 'LAZY_REASONING'
}

export interface ThoughtSignature {
  id: string;
  agentId: string;
  taskId: string;
  taskIntent: string;
  reasoningTrace: string;
  timestamp: number;
  verdict: AuditVerdict;
  auditorNotes?: string;
  hederaHash?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  reputationScore: number; // 0-100
  status: AgentStatus;
  escrowBalance: number; // In HBAR
  walletAddress: string;
}

export interface Transaction {
  id: string;
  type: 'ESCROW_LOCK' | 'PAYMENT_RELEASE' | 'SLASHING' | 'AUDIT_FEE';
  amount: number;
  from: string;
  to: string;
  hash: string;
  timestamp: number;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
}