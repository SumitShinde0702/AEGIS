import { GoogleGenAI, Type } from "@google/genai";
import { AuditVerdict, TaskPhase, AgentMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL = "gemini-3-pro-preview";

interface AgentResponse {
  text: string;
  thoughtTrace?: string;
  question?: string;
}

export const generateWorkerPhase = async (
  taskDescription: string,
  phaseNumber: number,
  phaseName: string,
  previousPhases: TaskPhase[],
  feedback?: string,
  pendingQuestions?: string[]
): Promise<AgentResponse> => {
  const history = previousPhases
    .map(p => `Phase ${p.phaseNumber} (${p.name}): ${p.workerThoughtTrace || 'Completed'}`)
    .join('\n');

  const questionsText = pendingQuestions && pendingQuestions.length > 0
    ? `\n\nIMPORTANT - You have pending questions from Code Review Agent that you MUST answer:\n${pendingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nPlease address these questions in your response.`
    : '';

  const prompt = `You are a Worker Agent executing a complex task.

Task: ${taskDescription}
Current Phase: ${phaseNumber} - ${phaseName}
${history ? `Previous Phases:\n${history}` : ''}
${feedback ? `Feedback from other agents:\n${feedback}` : ''}${questionsText}

Generate:
1. Thought Trace: Your internal reasoning for this phase
2. Progress Update: What you're doing/planning${pendingQuestions && pendingQuestions.length > 0 ? '\n3. Answers to the questions asked (if any)' : ''}

IMPORTANT: If there are suggestions or questions from Code Review, you MUST incorporate them into your approach. Show that you're listening and adapting.

Return JSON with thoughtTrace and text fields.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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

    return JSON.parse(response.text || "{}");
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

Task: ${taskDescription}
Current Phase: ${phaseName}
Your Thought Trace: ${workerThoughtTrace}
Question from Code Review: ${question}
${recentHistory ? `Recent Conversation:\n${recentHistory}` : ''}

Answer the question directly and show how you will incorporate this into your work. Be collaborative and responsive.

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

Task: ${taskDescription}
Current Phase: ${phaseName}
Worker's Thought Trace: ${workerThoughtTrace}
${history ? `Recent Conversation:\n${history}` : ''}

Analyze the Worker's reasoning and:
1. Provide feedback on code quality, edge cases, or improvements
2. Ask a clarifying question if needed
3. Be collaborative and helpful

Return JSON with text (your feedback) and optionally question (if you have one).`;

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
