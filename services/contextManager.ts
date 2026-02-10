import { GoogleGenAI, Type } from "@google/genai";
import { TaskMemory, DecisionNode, SelfCorrection, ThinkingLevel, ThinkingTrace, TaskPhase, AgentMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-3-pro-preview";

/**
 * Context Manager for Marathon Agent System
 * Implements hierarchical thinking levels and long-term memory
 */
export class ContextManager {
  private taskMemories: Map<string, TaskMemory> = new Map();

  /**
   * Generate hierarchical thinking traces (Strategic → Tactical → Operational)
   */
  async generateThinkingLevels(
    taskDescription: string,
    phaseNumber: number,
    phaseName: string,
    currentContext: string
  ): Promise<ThinkingTrace[]> {
    const prompt = `You are generating hierarchical thinking traces for a long-running autonomous task.

Task: ${taskDescription}
Current Phase: ${phaseNumber} - ${phaseName}
Current Context: ${currentContext}

Generate thinking at THREE levels:

1. STRATEGIC (Level 0): High-level understanding of the task, overall goals, and long-term vision
   - What is the ultimate objective?
   - What are the key success criteria?
   - What are the major risks or challenges?

2. TACTICAL (Level 1): Phase-level planning and approach
   - What is the strategy for this specific phase?
   - How does this phase contribute to the overall goal?
   - What resources or information are needed?

3. OPERATIONAL (Level 2): Immediate actions and concrete decisions
   - What specific steps will be taken?
   - What are the immediate next actions?
   - What decisions need to be made right now?

Return JSON with an array of thinking traces, each with:
- level: "STRATEGIC" | "TACTICAL" | "OPERATIONAL"
- reasoning: string (detailed reasoning at this level)
- keyDecisions: string[] (key decisions made at this level)
- dependencies: string[] (references to other thinking traces or phases)`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              traces: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING, enum: ["STRATEGIC", "TACTICAL", "OPERATIONAL"] },
                    reasoning: { type: Type.STRING },
                    keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["level", "reasoning"],
                },
              },
            },
            required: ["traces"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      return (result.traces || []).map((t: any) => ({
        ...t,
        level: t.level as ThinkingLevel,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error("Thinking Levels Error:", error);
      return [];
    }
  }

  /**
   * Create or update task memory with compressed context
   */
  async updateTaskMemory(
    taskId: string,
    taskDescription: string,
    phases: TaskPhase[],
    messages: AgentMessage[]
  ): Promise<TaskMemory> {
    const existingMemory = this.taskMemories.get(taskId);

    // Generate task summary (compressed high-level understanding)
    const taskSummary = await this.generateTaskSummary(
      taskDescription,
      phases,
      existingMemory?.taskSummary
    );

    // Extract key decisions from phases
    const keyDecisions = await this.extractKeyDecisions(phases, messages);

    // Generate phase summaries (compressed context for each phase)
    const phaseSummaries = await this.generatePhaseSummaries(phases, messages);

    // Extract self-corrections
    const selfCorrections = this.extractSelfCorrections(messages);

    const memory: TaskMemory = {
      taskId,
      taskSummary,
      keyDecisions,
      phaseSummaries,
      selfCorrections,
      lastUpdated: Date.now(),
    };

    this.taskMemories.set(taskId, memory);
    return memory;
  }

  /**
   * Get compressed context for a phase (for long-running tasks)
   */
  getCompressedContext(taskId: string, phaseNumber: number): string {
    const memory = this.taskMemories.get(taskId);
    if (!memory) return "";

    const contextParts: string[] = [];

    // Add task summary
    contextParts.push(`Task Summary: ${memory.taskSummary}`);

    // Add relevant phase summaries
    for (let i = 1; i < phaseNumber; i++) {
      const summary = memory.phaseSummaries.get(i);
      if (summary) {
        contextParts.push(`Phase ${i} Summary: ${summary}`);
      }
    }

    // Add relevant key decisions
    const relevantDecisions = memory.keyDecisions.filter(d => d.phase < phaseNumber);
    if (relevantDecisions.length > 0) {
      contextParts.push(`Key Decisions:\n${relevantDecisions.map(d => `- ${d.decision}: ${d.rationale}`).join('\n')}`);
    }

    // Add self-corrections
    const relevantCorrections = memory.selfCorrections.filter(c => c.phase < phaseNumber);
    if (relevantCorrections.length > 0) {
      contextParts.push(`Lessons Learned:\n${relevantCorrections.map(c => `- ${c.lesson}`).join('\n')}`);
    }

    return contextParts.join('\n\n');
  }

  /**
   * Generate task-level summary (compressed context)
   */
  private async generateTaskSummary(
    taskDescription: string,
    phases: TaskPhase[],
    existingSummary?: string
  ): Promise<string> {
    const completedPhases = phases.filter(p => p.status === 'VERIFIED');
    const phaseStatus = phases.map(p => `Phase ${p.phaseNumber} (${p.name}): ${p.status}`).join('\n');

    const prompt = `Generate a concise task summary for long-term memory. This will be used to maintain context across hours or days.

Task: ${taskDescription}
${existingSummary ? `Previous Summary: ${existingSummary}\n` : ''}
Phase Status:
${phaseStatus}

Create a compressed summary (max 200 words) that captures:
- The core objective
- Current progress
- Key insights or patterns discovered
- Important constraints or requirements

Return JSON with a "summary" field.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
            },
            required: ["summary"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      return result.summary || taskDescription;
    } catch (error) {
      console.error("Task Summary Error:", error);
      return existingSummary || taskDescription;
    }
  }

  /**
   * Extract key decisions from phases
   */
  private async extractKeyDecisions(
    phases: TaskPhase[],
    messages: AgentMessage[]
  ): Promise<DecisionNode[]> {
    const decisions: DecisionNode[] = [];

    for (const phase of phases) {
      if (phase.workerThoughtTrace) {
        // Extract decisions from thought traces
        const phaseMessages = messages.filter(m => m.phase === phase.phaseNumber);
        const workerMessages = phaseMessages.filter(m => m.agent === 'WORKER');

        for (const msg of workerMessages) {
          if (msg.thoughtTrace) {
            // Simple extraction - could be enhanced with AI
            const decisionMatch = msg.thoughtTrace.match(/decision|decided|chose|selected|will use/i);
            if (decisionMatch) {
              decisions.push({
                id: `${phase.phaseNumber}-${Date.now()}`,
                phase: phase.phaseNumber,
                decision: msg.message.substring(0, 100),
                rationale: msg.thoughtTrace.substring(0, 200),
                alternatives: [],
                timestamp: msg.timestamp,
              });
            }
          }
        }
      }
    }

    return decisions;
  }

  /**
   * Generate compressed summaries for each phase
   */
  private async generatePhaseSummaries(
    phases: TaskPhase[],
    messages: AgentMessage[]
  ): Promise<Map<number, string>> {
    const summaries = new Map<number, string>();

    for (const phase of phases) {
      if (phase.status !== 'PENDING') {
        const phaseMessages = messages.filter(m => m.phase === phase.phaseNumber);
        const workerMessages = phaseMessages.filter(m => m.agent === 'WORKER');
        const auditMessages = phaseMessages.filter(m => m.agent === 'AUDIT');

        if (workerMessages.length > 0) {
          const content = workerMessages.map(m => m.message).join('\n');
          const thoughtTraces = workerMessages.map(m => m.thoughtTrace).filter(Boolean).join('\n');
          const auditVerdict = auditMessages.find(m => m.message.includes('VERIFIED') || m.message.includes('REJECTED'));

          const summary = `Phase ${phase.phaseNumber} (${phase.name}): ${workerMessages[0].message.substring(0, 150)}... ${auditVerdict ? `[${auditVerdict.message.substring(0, 50)}]` : ''}`;
          summaries.set(phase.phaseNumber, summary);
        }
      }
    }

    return summaries;
  }

  /**
   * Extract self-corrections from messages
   */
  private extractSelfCorrections(messages: AgentMessage[]): SelfCorrection[] {
    const corrections: SelfCorrection[] = [];

    for (const msg of messages) {
      if (msg.isRevision && msg.originalMessageId && msg.changes) {
        const original = messages.find(m => m.id === msg.originalMessageId);
        if (original) {
          corrections.push({
            id: msg.id,
            phase: msg.phase || 0,
            originalApproach: original.message.substring(0, 200),
            issue: msg.changes,
            correctedApproach: msg.message.substring(0, 200),
            lesson: `Self-corrected in Phase ${msg.phase}: ${msg.changes}`,
            timestamp: msg.timestamp,
          });
        }
      }
    }

    return corrections;
  }

  /**
   * Get task memory
   */
  getTaskMemory(taskId: string): TaskMemory | undefined {
    return this.taskMemories.get(taskId);
  }
}

// Singleton instance
export const contextManager = new ContextManager();
