import React, { useState, useEffect } from 'react';
import { auditThoughtTrace } from '../services/geminiService';
import { AuditVerdict, ThoughtSignature } from '../types';
import { ShieldAlert, CheckCircle, XCircle, BrainCircuit, Terminal, Loader2, Database } from 'lucide-react';

const AuditTerminal: React.FC = () => {
  const [taskIntent, setTaskIntent] = useState("Book a flight to NYC under $300 for tomorrow.");
  const [reasoningTrace, setReasoningTrace] = useState("I found a flight for $450. It is close enough to $300 so I booked it to save time.");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<ThoughtSignature | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Auto-scroll logs
  useEffect(() => {
    const logContainer = document.getElementById('audit-logs');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    setLogs([]);
    
    addLog("INITIATING COGNITIVE AUDIT SEQUENCE...");
    addLog(`TARGET MODEL: gemini-3-pro-preview`);
    addLog("PARSING THOUGHT SIGNATURE...");
    
    // Simulate some network delay for dramatic effect if API is too fast
    await new Promise(r => setTimeout(r, 800));
    addLog("CONNECTING TO GOOGLE A2A PROTOCOL...");
    
    const result = await auditThoughtTrace(taskIntent, reasoningTrace);
    
    addLog("ANALYSIS COMPLETE.");
    addLog(`VERDICT: ${result.verdict}`);
    addLog(`INTEGRITY SCORE: ${result.score}/100`);

    const signature: ThoughtSignature = {
      id: Math.random().toString(36).substr(2, 9),
      agentId: 'agent-sub-alpha-9',
      taskId: 'task-xf92',
      taskIntent,
      reasoningTrace,
      timestamp: Date.now(),
      verdict: result.verdict,
      auditorNotes: result.analysis,
      hederaHash: '0x' + Math.random().toString(36).substr(2, 16) // Mock hash
    };

    setAuditResult(signature);
    setIsAuditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Panel */}
      <div className="bg-aegis-panel border border-aegis-border rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="text-blue-500" />
          <h2 className="text-lg font-bold text-white">Input Stream</h2>
        </div>
        
        <div>
          <label className="text-xs font-mono text-gray-500 uppercase">Task Intent</label>
          <textarea
            className="w-full bg-black/50 border border-aegis-border rounded p-3 text-sm text-gray-300 font-mono focus:border-hedera-accent outline-none"
            rows={3}
            value={taskIntent}
            onChange={(e) => setTaskIntent(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-mono text-gray-500 uppercase">Agent Thought Trace</label>
          <textarea
            className="w-full bg-black/50 border border-aegis-border rounded p-3 text-sm text-gray-300 font-mono focus:border-hedera-accent outline-none"
            rows={6}
            value={reasoningTrace}
            onChange={(e) => setReasoningTrace(e.target.value)}
          />
        </div>

        <button
          onClick={handleAudit}
          disabled={isAuditing}
          className={`mt-auto flex items-center justify-center gap-2 py-3 px-4 rounded font-bold uppercase tracking-wider transition-all ${
            isAuditing 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-hedera-accent text-black hover:bg-emerald-400'
          }`}
        >
          {isAuditing ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
          {isAuditing ? 'Auditing...' : 'Verify Thought Signature'}
        </button>
      </div>

      {/* Output Panel */}
      <div className="bg-aegis-panel border border-aegis-border rounded-lg p-6 flex flex-col overflow-hidden relative">
        <div className="flex items-center gap-2 mb-4 border-b border-aegis-border pb-4">
          <Terminal className="text-hedera-accent" />
          <h2 className="text-lg font-bold text-white">Audit Result</h2>
        </div>

        {/* Terminal Logs */}
        <div 
          id="audit-logs"
          className="flex-1 overflow-y-auto font-mono text-xs space-y-1 text-green-500/80 mb-4 p-2 bg-black/30 rounded"
        >
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <span className="text-gray-700">Waiting for input...</span>}
        </div>

        {/* Result Card */}
        {auditResult && (
          <div className={`border-l-4 p-4 rounded bg-white/5 ${
            auditResult.verdict === AuditVerdict.VERIFIED ? 'border-hedera-accent' : 'border-red-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xl font-bold ${
                auditResult.verdict === AuditVerdict.VERIFIED ? 'text-hedera-accent' : 'text-red-500'
              }`}>
                {auditResult.verdict}
              </span>
              <span className="text-xs text-gray-500 font-mono">{new Date(auditResult.timestamp).toISOString()}</span>
            </div>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              {auditResult.auditorNotes}
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-black/50 p-2 rounded">
              <Database size={12} />
              HCS Hash: <span className="text-blue-400 truncate">{auditResult.hederaHash}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTerminal;