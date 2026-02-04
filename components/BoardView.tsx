import React, { useRef, useEffect } from 'react';
import MessageCard from './MessageCard';
import { AgentMessage } from '../types';

interface BoardViewProps {
  messages: AgentMessage[];
  currentPhase?: number;
}

const BoardView: React.FC<BoardViewProps> = ({ messages, currentPhase }) => {
  const boardEndRef = useRef<HTMLDivElement>(null);
  const phaseGroups = new Map<number, AgentMessage[]>();

  useEffect(() => {
    boardEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by phase
  messages.forEach(msg => {
    const phase = msg.phase || 0;
    if (!phaseGroups.has(phase)) {
      phaseGroups.set(phase, []);
    }
    phaseGroups.get(phase)!.push(msg);
  });

  // Build message tree structure
  const buildMessageTree = (phaseMessages: AgentMessage[]) => {
    const messageMap = new Map<string, AgentMessage>();
    const rootMessages: AgentMessage[] = [];
    const childrenMap = new Map<string, AgentMessage[]>();

    // Create map of all messages
    phaseMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
      if (!childrenMap.has(msg.id)) {
        childrenMap.set(msg.id, []);
      }
    });

    // Build parent-child relationships
    phaseMessages.forEach(msg => {
      if (msg.respondsTo) {
        const parent = messageMap.get(msg.respondsTo);
        if (parent) {
          if (!childrenMap.has(msg.respondsTo)) {
            childrenMap.set(msg.respondsTo, []);
          }
          childrenMap.get(msg.respondsTo)!.push(msg);
        } else {
          rootMessages.push(msg);
        }
      } else {
        rootMessages.push(msg);
      }
    });

      // Render tree recursively
      const renderMessage = (msg: AgentMessage, depth: number = 0): React.ReactNode => {
        const children = childrenMap.get(msg.id) || [];
        const hasChildren = children.length > 0;
        const isConnected = depth > 0 || msg.respondsTo !== undefined;

        // Check if this is a revision - find original
        const originalMessage = msg.isRevision && msg.originalMessageId
          ? phaseMessages.find(m => m.id === msg.originalMessageId)
          : null;

        return (
          <div key={msg.id} className="relative">
            {/* Show original and revised side-by-side */}
            {msg.isRevision && originalMessage ? (
              <div className={`${depth > 0 ? 'ml-8' : ''} grid grid-cols-2 gap-4`}>
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-mono">ORIGINAL</div>
                  <MessageCard
                    message={originalMessage}
                    isConnected={isConnected}
                    hasChildren={false}
                  />
                </div>
                <div>
                  <div className="text-xs text-green-400 mb-2 font-mono">REVISED</div>
                  <MessageCard
                    message={msg}
                    isConnected={isConnected}
                    hasChildren={hasChildren}
                  />
                </div>
              </div>
            ) : (
              <div className={`${depth > 0 ? 'ml-8' : ''}`}>
                <MessageCard
                  message={msg}
                  isConnected={isConnected}
                  hasChildren={hasChildren}
                />
              </div>
            )}
            {hasChildren && (
              <div className="ml-8 mt-4 space-y-4">
                {children.map(child => renderMessage(child, depth + 1))}
              </div>
            )}
          </div>
        );
      };

    return rootMessages.map(msg => renderMessage(msg));
  };

  const sortedPhases = Array.from(phaseGroups.keys()).sort((a, b) => a - b);

  return (
    <div className="bg-aegis-bg min-h-full p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {sortedPhases.map(phase => {
          const phaseMessages = phaseGroups.get(phase)!;
          return (
            <div key={phase} className="space-y-4">
              {/* Phase Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 border-t border-gray-700/50"></div>
                <div className="px-4 py-2 bg-aegis-panel border border-aegis-border rounded-lg">
                  <span className="text-sm font-bold text-white">Phase {phase}</span>
                  {currentPhase === phase && (
                    <span className="ml-2 text-xs text-hedera-accent">(In Progress)</span>
                  )}
                </div>
                <div className="flex-1 border-t border-gray-700/50"></div>
              </div>

              {/* Phase Messages */}
              <div className="space-y-4">
                {buildMessageTree(phaseMessages)}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg mb-2">No messages yet</p>
            <p className="text-sm">Start a task to see agent collaboration</p>
          </div>
        )}

        <div ref={boardEndRef} />
      </div>
    </div>
  );
};

export default BoardView;
