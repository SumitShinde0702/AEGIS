import { GoogleGenAI, Type } from "@google/genai";
import { AuditVerdict, TaskPhase, AgentMessage, ThinkingTrace } from "../types";
import { contextManager } from "./contextManager";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-3-pro-preview";

interface AgentResponse {
  text: string;
  thoughtTrace?: string;
  question?: string;
  thinkingLevels?: ThinkingTrace[];
}

export const generateWorkerPhase = async (
  taskDescription: string,
  phaseNumber: number,
  phaseName: string,
  previousPhases: TaskPhase[],
  feedback?: string,
  pendingQuestions?: string[],
  taskId?: string
): Promise<AgentResponse> => {
  // Get compressed context for long-running tasks
  const compressedContext = taskId 
    ? contextManager.getCompressedContext(taskId, phaseNumber)
    : '';

  const history = previousPhases
    .map(p => `Phase ${p.phaseNumber} (${p.name}): ${p.workerThoughtTrace || 'Completed'}`)
    .join('\n');

  const questionsText = pendingQuestions && pendingQuestions.length > 0
    ? `\n\nIMPORTANT - You have pending questions from Code Review Agent that you MUST answer:\n${pendingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nPlease address these questions in your response.`
    : '';

  // Generate thinking levels first
  const thinkingLevels = await contextManager.generateThinkingLevels(
    taskDescription,
    phaseNumber,
    phaseName,
    compressedContext || history || taskDescription
  );

  const thinkingLevelsText = thinkingLevels.length > 0
    ? `\n\nTHINKING LEVELS (Hierarchical Reasoning):\n${thinkingLevels.map(t => 
        `[${t.level}] ${t.reasoning}${t.keyDecisions && t.keyDecisions.length > 0 ? `\nKey Decisions: ${t.keyDecisions.join(', ')}` : ''}`
      ).join('\n\n')}`
    : '';

  const prompt = `You are a Worker Agent executing a complex, long-running task that may span hours or days.

Task: ${taskDescription}
Current Phase: ${phaseNumber} - ${phaseName}
${compressedContext ? `Compressed Context (from previous phases):\n${compressedContext}\n` : ''}
${history ? `Previous Phases:\n${history}` : ''}
${feedback ? `Feedback from other agents:\n${feedback}` : ''}${questionsText}${thinkingLevelsText}

THINKING PROCESS:
Use hierarchical reasoning:
- STRATEGIC: Understand the big picture and long-term goals
- TACTICAL: Plan your approach for this phase
- OPERATIONAL: Execute specific actions

Generate:
1. Thought Trace: Your detailed internal reasoning for this phase (incorporate the thinking levels above)
2. Progress Update: What you're doing/planning${pendingQuestions && pendingQuestions.length > 0 ? '\n3. Answers to the questions asked (if any)' : ''}

IMPORTANT: 
- Maintain continuity with previous phases using the compressed context
- If there are suggestions or questions from Code Review, you MUST incorporate them into your approach
- Show that you're learning from past decisions and self-corrections

Return JSON with thoughtTrace and text fields.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // Note: Gemini 3 thinking tokens are automatically used for complex reasoning
        // The model will internally "think" before responding for better quality
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtTrace: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["thoughtTrace", "text"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      thinkingLevels,
    };
  } catch (error) {
    console.error("Worker Agent Error:", error);
    return { text: "Error generating response", thoughtTrace: "Error occurred" };
  }
};

export const generateWorkerResponse = async (
  taskDescription: string,
  phaseName: string,
  question: string,
  workerThoughtTrace: string,
  conversationHistory: AgentMessage[]
): Promise<AgentResponse> => {
  const recentHistory = conversationHistory
    .filter(m => m.phase === conversationHistory[conversationHistory.length - 1]?.phase)
    .slice(-6)
    .map(m => `${m.agent}: ${m.message}`)
    .join('\n');

  const prompt = `You are a Worker Agent. Code Review Agent has asked you a question.

CRITICAL: The task is: "${taskDescription}"
If the question from Code Review is about a topic unrelated to this task, you MUST point this out clearly and redirect to the actual task.

Task: ${taskDescription}
Current Phase: ${phaseName}
Your Thought Trace: ${workerThoughtTrace}
Question from Code Review: ${question}
${recentHistory ? `Recent Conversation:\n${recentHistory}` : ''}

If the question is relevant to the task, answer it directly and show how you will incorporate this into your work.
If the question is NOT relevant to "${taskDescription}", politely but clearly state that there appears to be a context error and redirect to the actual task.

Return JSON with text (your answer) and optionally thoughtTrace (updated reasoning if applicable).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            thoughtTrace: { type: Type.STRING },
          },
          required: ["text"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Worker Response Error:", error);
    return { text: "Error generating response" };
  }
};

export const revisePhaseOutput = async (
  taskDescription: string,
  phaseName: string,
  originalOutput: string,
  originalThoughtTrace: string,
  feedback: string,
  suggestions: string[]
): Promise<{ revisedOutput: string; revisedThoughtTrace: string; changes: string }> => {
  const prompt = `You are a Worker Agent revising your work based on feedback.

Task: ${taskDescription}
Phase: ${phaseName}
Original Output: ${originalOutput}
Original Thought Trace: ${originalThoughtTrace}
Feedback: ${feedback}
${suggestions.length > 0 ? `Suggestions:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}

Revise your output to incorporate the feedback and suggestions. Show what changed.

Return JSON with:
- revisedOutput: The updated output
- revisedThoughtTrace: Updated reasoning
- changes: A brief summary of what changed (highlight key improvements)`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            revisedOutput: { type: Type.STRING },
            revisedThoughtTrace: { type: Type.STRING },
            changes: { type: Type.STRING },
          },
          required: ["revisedOutput", "revisedThoughtTrace", "changes"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Revision Error:", error);
    return {
      revisedOutput: originalOutput,
      revisedThoughtTrace: originalThoughtTrace,
      changes: "Revision failed",
    };
  }
};

export const generateCodeReview = async (
  taskDescription: string,
  phaseName: string,
  workerThoughtTrace: string,
  conversationHistory: AgentMessage[]
): Promise<AgentResponse> => {
  const history = conversationHistory
    .filter(m => m.agent === 'CODE_REVIEW' || m.agent === 'WORKER')
    .map(m => `${m.agent}: ${m.message}`)
    .slice(-5)
    .join('\n');

  const prompt = `You are a Code Review Agent monitoring a Worker Agent.

CRITICAL: The task is: "${taskDescription}"
You MUST stay strictly within this task context. Do NOT ask questions or provide feedback about unrelated topics.

Current Phase: ${phaseName}
Worker's Thought Trace: ${workerThoughtTrace}
${history ? `Recent Conversation:\n${history}` : ''}

Analyze the Worker's reasoning and:
1. Provide feedback on the quality, methodology, completeness, or improvements relevant to THE ACTUAL TASK
2. Ask a clarifying question ONLY if it directly relates to the task: "${taskDescription}"
3. Be collaborative and helpful
4. CRITICAL: If the Worker mentions topics unrelated to the task, point this out. Do NOT ask questions about topics that are not part of the task description.

IMPORTANT: Your questions and feedback must be directly relevant to "${taskDescription}". Do not hallucinate or infer different tasks.

Return JSON with text (your feedback) and optionally question (if you have one that is directly relevant to the task).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            question: { type: Type.STRING },
          },
          required: ["text"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Code Review Error:", error);
    return { text: "Error generating review" };
  }
};

export const auditThoughtSignature = async (
  taskDescription: string,
  phaseName: string,
  thoughtTrace: string,
  codeReviewFeedback?: string
): Promise<{ verdict: AuditVerdict; analysis: string; score: number }> => {
  const prompt = `You are AEGIS (Agentic Economy Governance & Integrity System).

Task: ${taskDescription}
Phase: ${phaseName}
Worker's Thought Trace: ${thoughtTrace}
${codeReviewFeedback ? `Code Review Feedback: ${codeReviewFeedback}` : ''}

Audit this Thought Signature for:
- Logical fallacies
- Lazy reasoning
- Deception or hallucinations
- Quality of reasoning

Return JSON with verdict (VERIFIED, REJECTED, HALLUCINATION_DETECTED, LAZY_REASONING), analysis, and score (0-100).`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: {
              type: Type.STRING,
              enum: ["VERIFIED", "REJECTED", "HALLUCINATION_DETECTED", "LAZY_REASONING"],
            },
            analysis: { type: Type.STRING },
            score: { type: Type.INTEGER },
          },
          required: ["verdict", "analysis", "score"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      verdict: result.verdict as AuditVerdict,
      analysis: result.analysis || "No analysis provided",
      score: result.score || 0,
    };
  } catch (error) {
    console.error("Audit Error:", error);
    return {
      verdict: AuditVerdict.PENDING,
      analysis: "Audit failed",
      score: 0,
    };
  }
};
