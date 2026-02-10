# AEGIS Commander - Multi-Agent System Architecture

## Project Overview

**AEGIS Commander** is an autonomous agent governance system that implements real-time cognitive auditing for AI agent-to-agent (A2A) transactions. The system uses multi-agent collaboration to ensure quality, detect hallucinations, and enable self-correction.

## Core Concept

A **Marathon Agent System** where:
- **Human** provides a complex, long-running task
- **Worker Agent** executes the task in phases
- **Code Review Agent** monitors code quality and catches bugs
- **Audit Agent (AEGIS)** verifies reasoning quality in real-time
- All three agents **collaborate bidirectionally** (true A2A)

## Architecture

### Agent Roles

#### 1. Worker Agent
- **Purpose**: Execute the assigned task
- **Responsibilities**:
  - Break down task into phases
  - Generate thought traces for each phase
  - Implement solutions
  - Self-correct based on feedback
- **Communication**: Sends progress updates, asks for guidance

#### 2. Code Review Agent
- **Purpose**: Review code quality and catch bugs
- **Responsibilities**:
  - Analyze code changes
  - Identify edge cases
  - Suggest improvements
  - Verify correctness
- **Communication**: Provides feedback, asks clarifying questions

#### 3. Audit Agent (AEGIS)
- **Purpose**: Verify reasoning quality and detect issues
- **Responsibilities**:
  - Audit thought traces for lazy reasoning
  - Detect hallucinations
  - Verify logical consistency
  - Provide reasoning quality scores
- **Communication**: Issues verdicts, provides reasoning guidance

### Communication Flow

```
Human Input (Task)
    ↓
Worker Agent (Phase 1: Analysis)
    ↓ (sends thought trace)
Code Review Agent ←→ Audit Agent (AEGIS)
    ↓ (collaborate)
Both provide feedback
    ↓
Worker Agent (incorporates feedback)
    ↓
[If rejected] → Self-correction loop
    ↓
Worker Agent (Phase 2: Implementation)
    ↓
[Repeat for all phases]
```

### Key Features

1. **Bidirectional A2A Communication**
   - Agents ask questions to each other
   - Agents negotiate solutions
   - Agents learn from feedback

2. **Self-Correction Mechanism**
   - Worker Agent detects errors via audits
   - Automatically retries with improved reasoning
   - Shows "before/after" reasoning quality

3. **Real-Time Thought Visualization**
   - Live stream of agent reasoning
   - Visual thought traces (decision trees)
   - Real-time audit scores

4. **Marathon Task Execution**
   - Tasks span multiple phases
   - Long-running autonomous behavior
   - Progress tracking across phases

5. **Thinking Levels & Context Management** (NEW)
   - **Hierarchical Reasoning**: Strategic → Tactical → Operational thinking
   - **Compressed Context**: Task summaries maintain continuity across hours/days
   - **Decision Trees**: Track key decisions and their rationale
   - **Self-Correction Memory**: Learn from past mistakes
   - **Gemini 3 Thinking Tokens**: Deep reasoning before responding

5. **Multi-Modal Support** (Future)
   - Agents analyze code, images, documents
   - AEGIS audits multimodal reasoning

## Technical Implementation

### Service Layer

#### `services/aiService.ts` (NEW)
- Abstracted AI service wrapper
- Supports both DeepSeek and Gemini APIs
- Easy switching via `AI_PROVIDER` env variable
- Unified interface for all agents

#### `services/multiAgentService.ts` (NEW)
- Worker Agent generation
- Code Review Agent generation
- Audit Agent (AEGIS) generation
- Multi-agent conversation orchestration
- Integrated with Thinking Levels system

#### `services/contextManager.ts` (NEW - Cutting Edge)
- Hierarchical thinking level generation (Strategic/Tactical/Operational)
- Task memory management for long-running tasks (hours/days)
- Compressed context summarization (maintains continuity)
- Decision tree tracking (key decisions across phases)
- Self-correction pattern extraction (learns from mistakes)
- Context caching for efficiency (Gemini 3 feature)

#### `services/geminiService.ts` (EXISTING - Keep for compatibility)
- Current audit service
- Will be wrapped by `aiService.ts`

### Component Structure

#### `components/MarathonAgent.tsx` (NEW)
- Main multi-agent interface
- Three-panel layout:
  - **Left Panel**: Worker Agent progress & thought traces
  - **Middle Panel**: Code Review Agent feedback
  - **Right Panel**: Audit Agent (AEGIS) verdicts
- Task input field
- Phase progress visualization
- Real-time thought trace streaming

#### `components/A2AMonitor.tsx` (EXISTING - Keep)
- Original buyer/seller scenarios
- Can be used for comparison/demos

#### `components/AuditTerminal.tsx` (EXISTING - Keep)
- Manual audit interface
- Useful for testing

### Data Flow

1. **Human Input** → Task description
2. **Worker Agent** → Generates Phase 1 thought trace
3. **Multi-Agent Service** → Routes to Code Review + Audit
4. **Code Review Agent** → Analyzes code, provides feedback
5. **Audit Agent** → Verifies reasoning, issues verdict
6. **Worker Agent** → Incorporates feedback or self-corrects
7. **Repeat** for next phase

### State Management

```typescript
interface MarathonTask {
  id: string;
  description: string;
  phases: TaskPhase[];
  currentPhase: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

interface TaskPhase {
  phaseNumber: number;
  name: string;
  workerThoughtTrace: string;
  codeReviewFeedback?: string;
  auditVerdict?: AuditVerdict;
  auditScore?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
}

interface AgentMessage {
  id: string;
  agent: 'WORKER' | 'CODE_REVIEW' | 'AUDIT';
  message: string;
  thoughtTrace?: string;
  timestamp: number;
  phase?: number;
}
```

## API Integration

### DeepSeek API (Development)
- Use for development/testing
- Cheaper, avoids quota limits
- Set `AI_PROVIDER=deepseek` in `.env.local`

### Gemini 3 API (Production/Submission)
- Use for hackathon submission
- Access to Gemini 3-specific features
- Set `AI_PROVIDER=gemini` in `.env.local`

### API Abstraction

```typescript
interface AIService {
  generateContent(prompt: string, options?: any): Promise<string>;
  generateStructured(prompt: string, schema: any): Promise<any>;
}

// Implementation switches based on AI_PROVIDER
```

## Development Phases

### Phase 1: Core Multi-Agent System (4-6 hours) ✅ COMPLETED
- [x] Create `multiAgentService.ts` with three agents
- [x] Implement basic A2A communication
- [x] Create `MarathonAgent.tsx` component
- [x] Add task input and phase tracking
- [x] Update types.ts with Marathon Agent interfaces
- [x] Integrate into App.tsx and Sidebar.tsx

### Phase 2: Self-Correction & Collaboration (3-4 hours) ✅ COMPLETED
- [x] Implement self-correction loop (Worker retries on audit rejection)
- [x] Add agent-to-agent questions (Code Review can ask questions)
- [ ] Add learning curve tracking (future enhancement)
- [x] Thought trace visualization (displayed in Worker panel)

### Phase 3: UI/UX Polish (2-3 hours) ✅ COMPLETED
- [x] Three-panel layout (Worker | Code Review | Audit)
- [x] Real-time progress indicators (phase badges, status colors)
- [x] Thought trace visualization (displayed in Worker messages)
- [x] Audit verdict display (with icons and scores)

### Phase 4: Demo Preparation (1-2 hours)
- [ ] Record 3-minute demo video
- [ ] Create compelling scenarios
- [ ] Test with Gemini API
- [ ] Final UI polish

## Demo Scenarios

### Scenario 1: Code Refactoring Marathon
- **Task**: "Refactor this React component for performance"
- **Phases**: Analysis → Optimization → Implementation → Testing → Documentation
- **Show**: Worker makes mistake → Code Review catches it → Audit rejects → Worker self-corrects

### Scenario 2: Research Paper Writing
- **Task**: "Research and write a technical paper on AI agent governance"
- **Phases**: Research → Outline → Writing → Review → Finalization
- **Show**: Multi-agent collaboration, quality verification

### Scenario 3: Complex Bug Fix
- **Task**: "Fix this production bug in the payment system"
- **Phases**: Reproduce → Analyze → Fix → Test → Deploy
- **Show**: Code Review finds edge cases, Audit verifies reasoning

## Hackathon Submission Strategy

### Key Points to Highlight

1. **Real A2A Collaboration**
   - Not just monitoring - agents actively communicate
   - Bidirectional negotiation
   - Agents learn from each other

2. **Marathon Agent Capabilities**
   - Long-running autonomous tasks
   - Phase-based execution
   - Self-correction mechanism

3. **Gemini 3 Features Used**
   - Structured output (JSON schemas)
   - Long context window (for multi-phase tasks)
   - Reasoning quality detection

4. **Innovation**
   - First governance system for agent economies
   - Real-time cognitive auditing
   - Multi-agent collaboration framework

### Demo Video Script (3 minutes)

1. **(0:00-0:20)** Show dashboard, explain AEGIS system
2. **(0:20-0:45)** Human enters task: "Refactor React component"
3. **(0:45-1:15)** Worker starts Phase 1, sends to Code Review + Audit
4. **(1:15-1:45)** Code Review finds issue, Audit rejects lazy reasoning
5. **(1:45-2:15)** Worker self-corrects, gets verified
6. **(2:15-2:45)** Continue through phases, show collaboration
7. **(2:45-3:00)** Final metrics, task completion

## Environment Variables

```env
# AI Provider: 'gemini' or 'deepseek'
AI_PROVIDER=deepseek

# API Keys (use appropriate one based on AI_PROVIDER)
GEMINI_API_KEY=your_gemini_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Hedera (optional, for blockchain features)
HEDERA_NETWORK=testnet
```

## Future Enhancements

1. **Thought Signatures API** (Gemini 3 specific)
   - Track reasoning continuity across sessions
   - Maintain agent memory

2. **Multimodal Support**
   - Image analysis
   - Code visualization
   - Document understanding

3. **Agent Marketplace**
   - Reputation system
   - Escrow payments
   - Agent discovery

4. **Real-Time Streaming**
   - Live thought trace updates
   - WebSocket connections
   - Real-time collaboration

## Implementation Details

### Files Created/Modified

1. **`services/multiAgentService.ts`** (NEW)
   - `generateWorkerPhase()`: Worker Agent generates thought traces and progress
     - Accepts pending questions from Code Review
     - Incorporates feedback from previous phases
   - `generateCodeReview()`: Code Review Agent provides feedback and questions
   - `generateWorkerResponse()`: Worker responds to Code Review questions
   - `auditThoughtSignature()`: Audit Agent (AEGIS) verifies reasoning quality
   - All use Gemini 3 Pro Preview with structured JSON output

2. **`components/MarathonAgent.tsx`** (UPDATED)
   - Board-based view with linked cards
   - Task input field for human-provided tasks
   - Phase progress tracking with status indicators
   - Real-time message streaming
   - Self-correction loop on audit rejection
   - Revision loop after Code Review feedback
   - Message relationship tracking (respondsTo)
   - Clean, efficient state management

3. **`components/BoardView.tsx`** (NEW)
   - Single vertical board layout
   - Phase headers with dividers
   - Message tree rendering with connections
   - Visual dotted lines and arrows between related cards
   - Side-by-side display for original vs revised cards

4. **`components/MessageCard.tsx`** (NEW)
   - Expandable cards with details
   - Inline and expandable thought traces
   - Color-coded by agent type (Worker=blue, Code Review=purple, Audit=green)
   - Revision indicators with green highlights
   - Connection lines and arrows
   - Shows message relationships

5. **`types.ts`** (UPDATED)
   - Added `TaskPhase` interface
   - Added `MarathonTask` interface
   - Extended `AgentMessage` interface with:
     - `respondsTo`: Track message relationships
     - `isRevision`: Flag for revision cards
     - `originalMessageId`: Link to original message
     - `changes`: Highlighted changes in revisions

6. **`services/multiAgentService.ts`** (UPDATED)
   - Added `revisePhaseOutput()`: Worker revises output based on feedback
   - Returns revised output, thought trace, and change summary

7. **`App.tsx`** (UPDATED)
   - Added 'marathon' case to render MarathonAgent component

8. **`components/Sidebar.tsx`** (UPDATED)
   - Added 'Marathon Agent' menu item with Rocket icon

### Key Features Implemented

- ✅ **Multi-Agent Collaboration**: Three agents (Worker, Code Review, Audit) communicate bidirectionally
- ✅ **Phase-Based Execution**: Tasks broken into 5 phases (Analysis → Planning → Implementation → Review → Finalization)
- ✅ **Thought Signatures**: Worker generates thought traces for each phase
- ✅ **Real-Time Auditing**: AEGIS audits each thought signature immediately
- ✅ **Self-Correction**: Worker automatically retries with improved reasoning on rejection
- ✅ **Code Review Integration**: Code Review Agent provides feedback before audit
- ✅ **Question & Answer Flow**: Worker responds to Code Review questions within the same phase
- ✅ **Revision Loop**: Worker revises output based on Code Review feedback (NEW)
- ✅ **Side-by-Side Revisions**: Original and revised cards shown side-by-side with green highlights (NEW)
- ✅ **Board-Based UI**: Single vertical board with linked cards showing conversation flow (NEW)
- ✅ **Visual Connections**: Dotted lines and arrows connecting related messages (NEW)
- ✅ **Expandable Cards**: Cards expand to show details and thought traces (NEW)
- ✅ **Phase Separation**: Clear phase headers and dividers (NEW)
- ✅ **Suggestion Incorporation**: Worker incorporates Code Review suggestions into next phase
- ✅ **Visual Feedback**: Color-coded phase status, verdict icons, thought trace display

### Code Quality

- Clean, efficient code with no unnecessary functions
- Proper TypeScript typing throughout
- Error handling in all API calls
- Efficient state management with refs to prevent stale closures
- No linting errors

## Notes

- **Using Gemini 3 Pro Preview**: All agents use `gemini-3-pro-preview` for advanced reasoning
- **Thought Signatures**: Implemented via structured JSON output (thought traces)
- **Cost Optimization**: Efficient prompts, minimal token usage
- **Backward Compatible**: Existing components (A2AMonitor, AuditTerminal) still work
