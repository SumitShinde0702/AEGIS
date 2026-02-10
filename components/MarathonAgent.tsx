import React, { useState, useRef, useEffect } from 'react';
import { Play, StopCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { generateWorkerPhase, generateCodeReview, auditThoughtSignature, generateWorkerResponse, revisePhaseOutput } from '../services/multiAgentService';
import { contextManager } from '../services/contextManager';
import BoardView from './BoardView';
import ExportButton from './ExportButton';
import { MarathonTask, TaskPhase, AgentMessage, AuditVerdict } from '../types';

const TASK_PHASES = [
  { number: 1, name: 'Analysis' },
  { number: 2, name: 'Planning' },
  { number: 3, name: 'Implementation' },
  { number: 4, name: 'Review' },
  { number: 5, name: 'Finalization' },
];

const MarathonAgent: React.FC = () => {
  const [taskDescription, setTaskDescription] = useState('');
  const [currentTask, setCurrentTask] = useState<MarathonTask | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const isRunningRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (
    agent: 'WORKER' | 'CODE_REVIEW' | 'AUDIT',
    text: string,
    thoughtTrace?: string,
    phase?: number,
    respondsTo?: string,
    isRevision?: boolean,
    originalMessageId?: string,
    changes?: string
  ): string => {
    const messageId = Date.now().toString() + Math.random();
    setMessages(prev => [...prev, {
      id: messageId,
      agent,
      message: text,
      thoughtTrace,
      timestamp: Date.now(),
      phase,
      respondsTo,
      isRevision,
      originalMessageId,
      changes,
    }]);
    return messageId;
  };

  const startTask = async () => {
    if (!taskDescription.trim()) return;

    const task: MarathonTask = {
      id: Date.now().toString(),
      description: taskDescription,
      phases: TASK_PHASES.map(p => ({
        phaseNumber: p.number,
        name: p.name,
        status: 'PENDING',
        timestamp: Date.now(),
      })),
      currentPhase: 0,
      status: 'IN_PROGRESS',
      createdAt: Date.now(),
    };

    setCurrentTask(task);
    setMessages([]);
    setIsRunning(true);
    isRunningRef.current = true;
    setCurrentPhaseIndex(0);

    await runPhase(0, task);
  };

  const stopTask = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (currentTask) {
      setCurrentTask({ ...currentTask, status: 'FAILED' });
    }
  };

  const runPhase = async (phaseIndex: number, task: MarathonTask) => {
    if (!isRunningRef.current || phaseIndex >= TASK_PHASES.length) {
      if (isRunningRef.current) {
        setIsRunning(false);
        isRunningRef.current = false;
        setCurrentTask({ ...task, status: 'COMPLETED', currentPhase: TASK_PHASES.length });
      }
      return;
    }

    const phase = TASK_PHASES[phaseIndex];
    setCurrentPhaseIndex(phaseIndex);

    const updatedPhases = [...task.phases];
    updatedPhases[phaseIndex] = { ...updatedPhases[phaseIndex], status: 'IN_PROGRESS' };
    setCurrentTask({ ...task, phases: updatedPhases, currentPhase: phaseIndex });

    const previousPhases = task.phases.slice(0, phaseIndex);
    
    const allPreviousMessages = messages.filter(m => 
      m.phase && m.phase < phase.number
    );
    
    const codeReviewFeedback = allPreviousMessages
      .filter(m => m.agent === 'CODE_REVIEW')
      .map(m => {
        if (m.message.includes('Question:')) {
          return `Code Review Question: ${m.message.replace('Question: ', '')}`;
        }
        return `Code Review Feedback: ${m.message}`;
      })
      .join('\n');
    
    const auditFeedback = allPreviousMessages
      .filter(m => m.agent === 'AUDIT' && m.message.includes('VERIFIED') === false)
      .map(m => `Audit Note: ${m.message}`)
      .join('\n');
    
    const combinedFeedback = [codeReviewFeedback, auditFeedback]
      .filter(f => f.trim().length > 0)
      .join('\n\n');
    
    const pendingQuestions = allPreviousMessages
      .filter(m => m.agent === 'CODE_REVIEW' && m.message.includes('Question:'))
      .map(m => m.message.replace('Question: ', ''));

    const workerResponse = await generateWorkerPhase(
      task.description,
      phase.number,
      phase.name,
      previousPhases,
      combinedFeedback || undefined,
      pendingQuestions.length > 0 ? pendingQuestions : undefined,
      task.id
    );

    // Update task memory with new context
    await contextManager.updateTaskMemory(task.id, task.description, updatedPhases, messages);

    if (!isRunningRef.current) return;

    const workerMessageId = addMessage('WORKER', workerResponse.text, workerResponse.thoughtTrace, phase.number);

    updatedPhases[phaseIndex] = {
      ...updatedPhases[phaseIndex],
      workerThoughtTrace: workerResponse.thoughtTrace,
    };
    setCurrentTask({ ...task, phases: updatedPhases });

    await new Promise(r => setTimeout(r, 500));

    // Filter messages to only current phase to prevent context contamination
    const currentPhaseMessages = messages.filter(m => m.phase === phase.number);
    
    const codeReviewResponse = await generateCodeReview(
      task.description,
      phase.name,
      workerResponse.thoughtTrace || '',
      currentPhaseMessages
    );

    if (!isRunningRef.current) return;

    const codeReviewMessageId = addMessage('CODE_REVIEW', codeReviewResponse.text, undefined, phase.number, workerMessageId);
    
    let questionMessageId: string | undefined;
    if (codeReviewResponse.question) {
      questionMessageId = addMessage('CODE_REVIEW', `Question: ${codeReviewResponse.question}`, undefined, phase.number, codeReviewMessageId);
      
      await new Promise(r => setTimeout(r, 500));
      
      const workerAnswer = await generateWorkerResponse(
        task.description,
        phase.name,
        codeReviewResponse.question,
        workerResponse.thoughtTrace || '',
        currentPhaseMessages
      );

      if (!isRunningRef.current) return;

      const answerMessageId = addMessage('WORKER', `[Answering Code Review] ${workerAnswer.text}`, workerAnswer.thoughtTrace, phase.number, questionMessageId);
      
      if (workerAnswer.thoughtTrace) {
        updatedPhases[phaseIndex] = {
          ...updatedPhases[phaseIndex],
          workerThoughtTrace: workerAnswer.thoughtTrace,
        };
        setCurrentTask({ ...task, phases: updatedPhases });
      }
    }

    // REVISION LOOP: Revise based on Code Review feedback
    const suggestions = codeReviewResponse.text
      .split('\n')
      .filter(line => line.trim().length > 0 && !line.includes('Question:'))
      .map(line => line.trim());

    if (suggestions.length > 0) {
      await new Promise(r => setTimeout(r, 500));
      
      const revision = await revisePhaseOutput(
        task.description,
        phase.name,
        workerResponse.text,
        workerResponse.thoughtTrace || '',
        codeReviewResponse.text,
        suggestions
      );

      if (!isRunningRef.current) return;

      // Show original and revised side-by-side
      const revisionMessageId = addMessage(
        'WORKER',
        revision.revisedOutput,
        revision.revisedThoughtTrace,
        phase.number,
        codeReviewMessageId,
        true, // isRevision
        workerMessageId, // originalMessageId
        revision.changes
      );

      // Update phase with revised thought trace
      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        workerThoughtTrace: revision.revisedThoughtTrace,
      };
      setCurrentTask({ ...task, phases: updatedPhases });
    }

    updatedPhases[phaseIndex] = {
      ...updatedPhases[phaseIndex],
      codeReviewFeedback: codeReviewResponse.text,
    };
    setCurrentTask({ ...task, phases: updatedPhases });

    await new Promise(r => setTimeout(r, 500));

    const auditResult = await auditThoughtSignature(
      task.description,
      phase.name,
      workerResponse.thoughtTrace || '',
      codeReviewResponse.text
    );

    if (!isRunningRef.current) return;

    const verdictText = auditResult.verdict === AuditVerdict.VERIFIED
      ? `✓ VERIFIED (Score: ${auditResult.score}/100)`
      : `✗ ${auditResult.verdict} (Score: ${auditResult.score}/100)`;

    // Use the most recent Code Review message ID (question if exists, otherwise feedback)
    const auditRespondsTo = questionMessageId || codeReviewMessageId;
    const auditMessageId = addMessage('AUDIT', `${verdictText}\n${auditResult.analysis}`, undefined, phase.number, auditRespondsTo);

    updatedPhases[phaseIndex] = {
      ...updatedPhases[phaseIndex],
      status: auditResult.verdict === AuditVerdict.VERIFIED ? 'VERIFIED' : 'REJECTED',
      auditVerdict: auditResult.verdict,
      auditScore: auditResult.score,
    };
    setCurrentTask({ ...task, phases: updatedPhases });

    if (auditResult.verdict !== AuditVerdict.VERIFIED) {
      addMessage('WORKER', 'Self-correcting based on feedback...', undefined, phase.number);
      await new Promise(r => setTimeout(r, 1000));

      const currentPhaseMessages = messages.filter(m => m.phase === phase.number);
      const currentQuestions = currentPhaseMessages
        .filter(m => m.agent === 'CODE_REVIEW' && m.message.includes('Question:'))
        .map(m => m.message.replace('Question: ', ''));
      
      const retryFeedback = [
        `Previous attempt was ${auditResult.verdict}. ${auditResult.analysis}`,
        codeReviewResponse.text,
        currentPhaseMessages.filter(m => m.agent === 'CODE_REVIEW').map(m => m.message).join('\n')
      ].filter(f => f.trim().length > 0).join('\n\n');

      const retryResponse = await generateWorkerPhase(
        task.description,
        phase.number,
        phase.name,
        previousPhases,
        retryFeedback,
        currentQuestions.length > 0 ? currentQuestions : undefined
      );

      if (!isRunningRef.current) return;

      const retryMessageId = addMessage('WORKER', `[RETRY] ${retryResponse.text}`, retryResponse.thoughtTrace, phase.number, auditMessageId, true, workerMessageId);

      const retryAudit = await auditThoughtSignature(
        task.description,
        phase.name,
        retryResponse.thoughtTrace || '',
        codeReviewResponse.text
      );

      if (!isRunningRef.current) return;

      const retryVerdictText = retryAudit.verdict === AuditVerdict.VERIFIED
        ? `✓ VERIFIED after correction (Score: ${retryAudit.score}/100)`
        : `✗ Still ${retryAudit.verdict} (Score: ${retryAudit.score}/100)`;

      const retryAuditMessageId = addMessage('AUDIT', `${retryVerdictText}\n${retryAudit.analysis}`, undefined, phase.number, retryMessageId);

      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        status: retryAudit.verdict === AuditVerdict.VERIFIED ? 'VERIFIED' : 'REJECTED',
        auditVerdict: retryAudit.verdict,
        auditScore: retryAudit.score,
        workerThoughtTrace: retryResponse.thoughtTrace,
      };
      setCurrentTask({ ...task, phases: updatedPhases });
    }

    await new Promise(r => setTimeout(r, 1000));

    if (isRunningRef.current) {
      await runPhase(phaseIndex + 1, { ...task, phases: updatedPhases });
    }
  };

  const getVerdictIcon = (verdict?: AuditVerdict) => {
    if (!verdict) return null;
    if (verdict === AuditVerdict.VERIFIED) return <CheckCircle2 className="text-green-500" size={16} />;
    if (verdict === AuditVerdict.REJECTED || verdict === AuditVerdict.LAZY_REASONING) return <XCircle className="text-red-500" size={16} />;
    return <AlertTriangle className="text-yellow-500" size={16} />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-aegis-panel border border-aegis-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Marathon Agent System</h2>
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={startTask}
                disabled={!taskDescription.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded bg-hedera-accent text-black font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Play size={16} />
                Start Task
              </button>
            ) : (
              <button
                onClick={stopTask}
                className="flex items-center gap-2 px-4 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
              >
                <StopCircle size={16} />
                Stop
              </button>
            )}
            <ExportButton messages={messages} task={currentTask} />
          </div>
        </div>

        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Enter a complex task for the agents to work on (e.g., 'Refactor this React component for performance')"
          className="w-full bg-black/50 border border-aegis-border rounded p-3 text-sm text-gray-300 font-mono focus:border-hedera-accent outline-none"
          rows={3}
          disabled={isRunning}
        />

        {currentTask && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {currentTask.phases.map((phase, idx) => (
              <div
                key={phase.phaseNumber}
                className={`px-3 py-1 rounded text-xs font-mono border ${
                  idx === currentPhaseIndex
                    ? 'bg-hedera-accent/20 border-hedera-accent text-hedera-accent'
                    : phase.status === 'VERIFIED'
                    ? 'bg-green-500/10 border-green-500/30 text-green-500'
                    : phase.status === 'REJECTED'
                    ? 'bg-red-500/10 border-red-500/30 text-red-500'
                    : 'bg-white/5 border-aegis-border text-gray-400'
                }`}
              >
                {phase.phaseNumber}. {phase.name} {getVerdictIcon(phase.auditVerdict)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-aegis-panel border border-aegis-border rounded-lg h-[calc(100vh-16rem)] overflow-visible">
        <BoardView messages={messages} currentPhase={currentPhaseIndex + 1} />
      </div>
    </div>
  );
};

export default MarathonAgent;
