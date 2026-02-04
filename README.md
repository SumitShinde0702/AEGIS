<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AEGIS Commander 🛡️

**Autonomous Agent Governance & Integrity System**

A real-time cognitive auditing platform for AI agent-to-agent (A2A) transactions. AEGIS implements multi-agent collaboration where Worker Agents, Code Review Agents, and Audit Agents work together to ensure quality, detect hallucinations, and enable self-correction.

**Built for the Gemini 3 Global Hackathon** 🏆

---

## 🎯 Core Concept

AEGIS Commander implements a **Marathon Agent System** with true A2A collaboration:

- **Human** provides complex, long-running tasks
- **Worker Agent** executes tasks in phases with autonomous reasoning
- **Code Review Agent** monitors code quality and catches bugs in real-time
- **Audit Agent (AEGIS)** verifies reasoning quality and detects hallucinations
- **All three agents collaborate bidirectionally** - asking questions, negotiating solutions, and learning from each other

This is **not just monitoring** - it's real multi-agent collaboration where agents actively communicate and improve together.

---

## ✨ Key Features

### 🤖 Multi-Agent Collaboration
- **Worker Agent**: Executes tasks autonomously across multiple phases
- **Code Review Agent**: Provides real-time code quality feedback
- **Audit Agent (AEGIS)**: Verifies reasoning quality and detects issues
- **Bidirectional A2A**: Agents ask questions, negotiate, and learn from each other

### 🔄 Self-Correction Mechanism
- Workers detect errors via audit feedback
- Automatically retry with improved reasoning
- Visual "before/after" reasoning quality comparison

### 📊 Real-Time Monitoring
- Live thought trace visualization
- Phase-based progress tracking
- Real-time audit scores and verdicts
- Blockchain-backed immutable ledger (Hedera)

### 🎨 Multiple Interfaces
- **Marathon Agent**: Multi-agent collaboration for long-running tasks
- **A2A Monitor**: Agent-to-agent transaction scenarios
- **Audit Terminal**: Manual thought signature auditing
- **Dashboard**: System-wide metrics and monitoring

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- API Key (Gemini 3 or DeepSeek)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create `.env.local` in the project root:
   ```env
   # Choose your AI provider: 'gemini' or 'deepseek'
   AI_PROVIDER=deepseek
   
   # API Keys (use the one matching your AI_PROVIDER)
   GEMINI_API_KEY=your_gemini_key_here
   DEEPSEEK_API_KEY=your_deepseek_key_here
   ```

   **💡 Tip**: Use DeepSeek for development (cheaper), switch to Gemini for submission.

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 🏗️ Architecture

### Agent Communication Flow

```
Human Input (Task)
    ↓
Worker Agent (Phase 1: Analysis)
    ↓ (sends thought trace)
Code Review Agent ←→ Audit Agent (AEGIS)
    ↓ (collaborate & provide feedback)
Worker Agent (incorporates feedback)
    ↓
[If rejected] → Self-correction loop
    ↓
Worker Agent (Phase 2: Implementation)
    ↓
[Repeat for all phases until completion]
```

### Components

- **`components/MarathonAgent.tsx`**: Multi-agent collaboration interface
- **`components/A2AMonitor.tsx`**: Agent-to-agent transaction scenarios
- **`components/AuditTerminal.tsx`**: Manual audit interface
- **`services/multiAgentService.ts`**: Multi-agent orchestration
- **`services/aiService.ts`**: AI provider abstraction (Gemini/DeepSeek)

See [AI.MD](AI.MD) for detailed architecture documentation.

---

## 🎬 Demo Scenarios

### Scenario 1: Code Refactoring Marathon
- **Task**: "Refactor this React component for performance"
- **Shows**: Worker makes mistake → Code Review catches it → Audit rejects → Worker self-corrects

### Scenario 2: Research Paper Writing
- **Task**: "Research and write a technical paper on AI agent governance"
- **Shows**: Multi-agent collaboration, quality verification across phases

### Scenario 3: Complex Bug Fix
- **Task**: "Fix this production bug in the payment system"
- **Shows**: Code Review finds edge cases, Audit verifies reasoning quality

---

## 🛠️ Development

### Project Structure
```
aegis-commander/
├── components/          # React components
│   ├── MarathonAgent.tsx    # Multi-agent interface
│   ├── A2AMonitor.tsx       # A2A scenarios
│   └── AuditTerminal.tsx    # Manual audit
├── services/            # Business logic
│   ├── multiAgentService.ts # Multi-agent orchestration
│   ├── aiService.ts         # AI provider abstraction
│   └── geminiService.ts     # Gemini-specific service
├── pages/               # Page components
└── types.ts            # TypeScript definitions
```

### Switching AI Providers

The system supports both **DeepSeek** (development) and **Gemini 3** (production):

1. Set `AI_PROVIDER` in `.env.local`:
   ```env
   AI_PROVIDER=deepseek  # or 'gemini'
   ```

2. Add corresponding API key:
   ```env
   DEEPSEEK_API_KEY=your_key  # if using DeepSeek
   GEMINI_API_KEY=your_key    # if using Gemini
   ```

3. Restart dev server - switching is seamless!

---

## 🏆 Hackathon Submission

### Gemini 3 Features Used

- **Structured Output**: JSON schemas for consistent agent responses
- **Long Context Window**: Multi-phase task execution
- **Reasoning Quality Detection**: Advanced prompt engineering for audit
- **Multi-Agent Orchestration**: Complex A2A communication patterns

### Key Innovation Points

1. **Real A2A Collaboration**: Not just monitoring - agents actively communicate and negotiate
2. **Marathon Agent System**: Long-running autonomous tasks with self-correction
3. **Cognitive Auditing**: Real-time reasoning quality verification
4. **Blockchain Integration**: Immutable audit ledger on Hedera

---

## 📚 Documentation

- **[AI.MD](AI.MD)**: Detailed architecture and development guide
- **Component Docs**: See individual component files for usage

---

## 🔗 Links

- **AI Studio**: [View in AI Studio](https://ai.studio/apps/drive/1eodOzVgGckdpYnGD7YkySs5PeV2d2L-_)
- **Gemini API Docs**: [Google AI Studio](https://ai.google.dev/)
- **Hedera Docs**: [Hedera Mirror Node API](https://docs.hedera.com/hedera/sdks-and-apis/rest-api)

---

## 📝 License

Built for the Gemini 3 Global Hackathon by Google DeepMind & Devpost.

---

## 🙏 Acknowledgments

- Google DeepMind for Gemini 3 API
- Hedera for blockchain infrastructure
- The open-source community

---

<div align="center">
<strong>Built with ❤️ for the future of autonomous AI agents</strong>
</div>
