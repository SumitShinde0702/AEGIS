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

export interface TaskPhase {
  phaseNumber: number;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
  workerThoughtTrace?: string;
  codeReviewFeedback?: string;
  auditVerdict?: AuditVerdict;
  auditScore?: number;
  timestamp: number;
}

export interface MarathonTask {
  id: string;
  description: string;
  phases: TaskPhase[];
  currentPhase: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: number;
}

export interface AgentMessage {
  id: string;
  agent: 'WORKER' | 'CODE_REVIEW' | 'AUDIT';
  message: string;
  thoughtTrace?: string;
  timestamp: number;
  phase?: number;
  respondsTo?: string; // ID of message this responds to
  isRevision?: boolean;
  originalMessageId?: string; // For revision cards
  changes?: string; // Highlighted changes in revision
}

// Thinking Levels System
export enum ThinkingLevel {
  STRATEGIC = 'STRATEGIC', // High-level task understanding and goals
  TACTICAL = 'TACTICAL',   // Phase-level planning and approach
  OPERATIONAL = 'OPERATIONAL' // Immediate actions and decisions
}

export interface ThinkingTrace {
  level: ThinkingLevel;
  reasoning: string;
  keyDecisions?: string[];
  dependencies?: string[]; // Links to other thinking traces
  timestamp: number;
}

export interface TaskMemory {
  taskId: string;
  taskSummary: string; // Compressed high-level understanding
  keyDecisions: DecisionNode[];
  phaseSummaries: Map<number, string>; // Compressed phase context
  selfCorrections: SelfCorrection[];
  contextCache?: string; // For Gemini 3 context caching
  lastUpdated: number;
}

export interface DecisionNode {
  id: string;
  phase: number;
  decision: string;
  rationale: string;
  alternatives: string[];
  outcome?: string;
  timestamp: number;
}

export interface SelfCorrection {
  id: string;
  phase: number;
  originalApproach: string;
  issue: string;
  correctedApproach: string;
  lesson: string;
  timestamp: number;
}