import React, { useState } from 'react';
import { Bot, Code, Shield, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';
import { AgentMessage } from '../types';

interface MessageCardProps {
  message: AgentMessage;
  isConnected?: boolean;
  hasChildren?: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, isConnected, hasChildren }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThoughtTraceExpanded, setIsThoughtTraceExpanded] = useState(false);

  const getAgentConfig = () => {
    switch (message.agent) {
      case 'WORKER':
        return {
          icon: Bot,
          color: 'blue',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400',
        };
      case 'CODE_REVIEW':
        return {
          icon: Code,
          color: 'purple',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          textColor: 'text-purple-400',
        };
      case 'AUDIT':
        return {
          icon: Shield,
          color: 'green',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
        };
    }
  };

  const config = getAgentConfig();
  const Icon = config.icon;

  return (
    <div className="relative">
      {/* Connection line from above */}
      {isConnected && (
        <div className="absolute -top-4 left-6 w-0.5 h-4 border-l-2 border-dashed border-gray-600"></div>
      )}

      <div
        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 transition-all hover:shadow-lg ${
          message.isRevision ? 'ring-2 ring-green-500/50' : ''
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${config.bgColor}`}>
              <Icon size={16} className={config.textColor} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${config.textColor}`}>
                  {message.agent === 'WORKER' ? 'Worker Agent' : 
                   message.agent === 'CODE_REVIEW' ? 'Code Review Agent' : 
                   'Audit Agent (AEGIS)'}
                </span>
                {message.isRevision && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">REVISION</span>
                )}
                {message.phase && (
                  <span className="text-xs text-gray-500">Phase {message.phase}</span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Message Content */}
        <div className="text-sm text-gray-200 whitespace-pre-wrap mb-2">
          {message.message}
        </div>

        {/* Changes Highlight (for revisions) */}
        {message.isRevision && message.changes && (
          <div className="mb-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-xs">
            <span className="text-green-400 font-semibold">Changes:</span>
            <div className="text-gray-300 mt-1">{message.changes}</div>
          </div>
        )}

        {/* Thought Trace (Expandable) */}
        {message.thoughtTrace && (
          <div className="mt-3">
            <button
              onClick={() => setIsThoughtTraceExpanded(!isThoughtTraceExpanded)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors w-full"
            >
              <span className="font-mono">Thought Trace</span>
              {isThoughtTraceExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {isThoughtTraceExpanded && (
              <div className="mt-2 p-3 bg-black/40 border-l-2 border-blue-500/50 rounded text-xs font-mono text-gray-400 italic">
                {message.thoughtTrace}
              </div>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2 text-xs text-gray-400">
            <div>
              <span className="font-semibold">Message ID:</span> {message.id.substring(0, 8)}...
            </div>
            {message.respondsTo && (
              <div>
                <span className="font-semibold">Responds to:</span> {message.respondsTo.substring(0, 8)}...
              </div>
            )}
            {message.originalMessageId && (
              <div>
                <span className="font-semibold">Original:</span> {message.originalMessageId.substring(0, 8)}...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection arrow to children */}
      {hasChildren && (
        <div className="absolute -bottom-4 left-6 w-0.5 h-4 border-l-2 border-dashed border-gray-600">
          <ArrowDown size={12} className="absolute -bottom-2 -left-1.5 text-gray-600" />
        </div>
      )}
    </div>
  );
};

export default MessageCard;
