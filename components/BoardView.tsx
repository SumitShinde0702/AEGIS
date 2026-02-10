import React, { useRef, useEffect } from 'react';
import CanvasView from './CanvasView';
import PhaseColumn from './PhaseColumn';
import { AgentMessage } from '../types';

interface BoardViewProps {
  messages: AgentMessage[];
  currentPhase?: number;
}

const BoardView: React.FC<BoardViewProps> = ({ messages, currentPhase }) => {
  const boardEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll if there are new messages, and use setTimeout to avoid blocking
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        boardEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Group messages by phase, then find root messages per phase
  const phaseGroups = new Map<number, AgentMessage[]>();
  messages.forEach(msg => {
    const phase = msg.phase || 0;
    if (!phaseGroups.has(phase)) {
      phaseGroups.set(phase, []);
    }
    phaseGroups.get(phase)!.push(msg);
  });

  // Find root messages (Worker messages that don't respond to anything and aren't answers/retries)
  const rootMessages = messages.filter(
    msg => msg.agent === 'WORKER' && 
           !msg.respondsTo && 
           !msg.isRevision &&
           !msg.message.includes('[Answering Code Review]') &&
           !msg.message.includes('[RETRY]')
  );

  // Build thread for each root message
  const buildThread = (rootId: string, phaseNum: number): AgentMessage[] => {
    const thread: AgentMessage[] = [];
    const messageMap = new Map<string, AgentMessage>();
    const visited = new Set<string>();
    const phaseMessages = phaseGroups.get(phaseNum) || [];
    
    // Create map of all messages in this phase
    phaseMessages.forEach(msg => messageMap.set(msg.id, msg));
    
    // Recursively collect all messages in this thread
    const collectMessages = (msgId: string) => {
      if (visited.has(msgId)) return; // Prevent infinite loops
      visited.add(msgId);
      
      const msg = messageMap.get(msgId);
      if (msg) {
        thread.push(msg);
        // Find all messages that respond to this one (in same phase)
        phaseMessages
          .filter(m => m.respondsTo === msgId)
          .forEach(child => collectMessages(child.id));
      }
    };
    
    collectMessages(rootId);
    
    // Also include any messages in this phase that should be linked but aren't
    const linkedIds = new Set(thread.map(m => m.id));
    phaseMessages.forEach(msg => {
      if (!linkedIds.has(msg.id) && msg.phase === phaseNum) {
        // If it responds to something in the thread, add it
        if (msg.respondsTo && thread.find(t => t.id === msg.respondsTo)) {
          thread.push(msg);
        }
      }
    });
    
    return thread.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  };

  // Create columns from root messages
  const columns = rootMessages
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .map((root, index) => ({
      rootMessage: root,
      thread: buildThread(root.id, root.phase || 0),
      phase: root.phase || 0,
      isLast: index === rootMessages.length - 1,
    }));

  // Debug: Log message counts
  React.useEffect(() => {
    console.log('Total messages:', messages.length);
    console.log('Root messages:', rootMessages.length);
    console.log('Code Review messages:', messages.filter(m => m.agent === 'CODE_REVIEW').length);
    console.log('Audit messages:', messages.filter(m => m.agent === 'AUDIT').length);
    columns.forEach((col, idx) => {
      console.log(`Column ${idx} thread size:`, col.thread.length);
    });
  }, [messages, rootMessages, columns]);

  return (
    <CanvasView>
      <div className="flex items-start gap-8 min-h-full min-w-max pb-8" ref={boardEndRef}>
        {columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-64 text-gray-500">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start a task to see agent collaboration</p>
            {messages.length > 0 && (
              <p className="text-xs text-yellow-500 mt-2">
                Debug: {messages.length} messages found but no root messages
              </p>
            )}
          </div>
        ) : (
          columns.map((column, index) => (
            <div key={column.rootMessage.id} className="relative">
              <PhaseColumn
                rootMessage={column.rootMessage}
                thread={column.thread}
                phase={column.phase}
                isLast={column.isLast}
              />
            </div>
          ))
        )}
      </div>
    </CanvasView>
  );
};

export default BoardView;
