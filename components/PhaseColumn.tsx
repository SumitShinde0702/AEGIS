import React from 'react';
import MessageCard from './MessageCard';
import { AgentMessage } from '../types';

interface PhaseColumnProps {
  rootMessage: AgentMessage;
  thread: AgentMessage[];
  phase: number;
  isLast: boolean;
}

const PhaseColumn: React.FC<PhaseColumnProps> = ({ rootMessage, thread, phase, isLast }) => {
  // Build message tree for this thread
  const messageMap = new Map<string, AgentMessage>();
  const childrenMap = new Map<string, AgentMessage[]>();

  // Add root message
  messageMap.set(rootMessage.id, rootMessage);
  childrenMap.set(rootMessage.id, []);

  // Build relationships - include root message in map
  thread.forEach(msg => {
    messageMap.set(msg.id, msg);
    if (!childrenMap.has(msg.id)) {
      childrenMap.set(msg.id, []);
    }
    if (msg.respondsTo) {
      // Make sure parent exists in map
      const parent = thread.find(m => m.id === msg.respondsTo) || rootMessage;
      if (parent) {
        messageMap.set(parent.id, parent);
        if (!childrenMap.has(msg.respondsTo)) {
          childrenMap.set(msg.respondsTo, []);
        }
        childrenMap.get(msg.respondsTo)!.push(msg);
      }
    }
  });

  // Render message tree recursively
  const renderMessage = (msg: AgentMessage, depth: number = 0): React.ReactNode => {
    const children = childrenMap.get(msg.id) || [];
    const hasChildren = children.length > 0;
    const isConnected = depth > 0 || msg.respondsTo !== undefined;

    // Check if this is a revision with original
    const originalMessage = msg.isRevision && msg.originalMessageId
      ? thread.find(m => m.id === msg.originalMessageId) || messageMap.get(msg.originalMessageId)
      : null;

    return (
      <div key={msg.id} className="relative">
        {/* Connection line from above */}
        {isConnected && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 border-l-2 border-dashed border-gray-600"></div>
        )}

        {/* Show original and revised side-by-side */}
        {msg.isRevision && originalMessage ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-2 font-mono text-center">ORIGINAL</div>
              <MessageCard
                message={originalMessage}
                isConnected={isConnected}
                hasChildren={false}
              />
            </div>
            <div>
              <div className="text-xs text-green-400 mb-2 font-mono text-center">REVISED</div>
              <MessageCard
                message={msg}
                isConnected={isConnected}
                hasChildren={hasChildren}
              />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <MessageCard
              message={msg}
              isConnected={isConnected}
              hasChildren={hasChildren}
            />
          </div>
        )}

        {/* Connection line to children */}
        {hasChildren && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 border-l-2 border-dashed border-gray-600">
            <div className="absolute -bottom-2 -left-1.5 w-3 h-3 border-2 border-gray-600 rounded-full bg-aegis-bg"></div>
          </div>
        )}

        {/* Render children */}
        {hasChildren && (
          <div className="mt-4 space-y-4">
            {children.map(child => renderMessage(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-w-[820px] max-w-[820px] relative">
      {/* Column Header */}
      <div className="w-full mb-4 px-4 py-2 bg-aegis-panel border border-aegis-border rounded-lg text-center">
        <div className="text-sm font-bold text-white">Phase {phase}</div>
        {thread.length > 1 && (
          <div className="text-xs text-gray-400 mt-1">
            {thread.length} messages
          </div>
        )}
      </div>

      {/* Messages Stack */}
      <div className="w-full flex-1">
        {renderMessage(rootMessage)}
      </div>

      {/* Horizontal Arrow to Next Column */}
      {!isLast && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 flex items-center z-10">
          <div className="w-8 h-0.5 bg-gray-600"></div>
          <div className="w-0 h-0 border-l-8 border-l-gray-600 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default PhaseColumn;
