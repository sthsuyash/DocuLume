/**
 * Main Context Panel
 * Combines all context visualization components
 */

import React from 'react';
import { ContextUsageBar } from './ContextUsageBar';
import { ContextBreakdown } from './ContextBreakdown';
import { ModelInfoPanel } from './ModelInfoPanel';
import { SummarizationStatus } from './SummarizationStatus';
import { Card } from '../ui/card';

export interface ContextData {
  totalTokens: number;
  maxTokens: number;
  percentageUsed: number;
  tokensByRole: {
    system: number;
    user: number;
    assistant: number;
  };
  messageCount: number;
  warningLevel: 'ok' | 'warning' | 'critical';
  availableTokens: number;
  maxResponseTokens: number;
  estimatedCost: number;
  modelName: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
}

export interface SummarizationState {
  status: 'idle' | 'summarizing' | 'complete' | 'error';
  messagesCount?: number;
  reductionPercentage?: number;
  error?: string;
}

interface ContextPanelProps {
  context: ContextData | null;
  summarization: SummarizationState;
  className?: string;
  compact?: boolean;
}

export function ContextPanel({
  context,
  summarization,
  className = '',
  compact = false,
}: ContextPanelProps) {
  if (!context) {
    return null;
  }

  if (compact) {
    // Compact view - just the usage bar
    return (
      <div className={className}>
        <ContextUsageBar
          totalTokens={context.totalTokens}
          maxTokens={context.maxTokens}
          percentageUsed={context.percentageUsed}
          warningLevel={context.warningLevel}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Summarization status */}
      {summarization.status !== 'idle' && (
        <SummarizationStatus
          status={summarization.status}
          messagesCount={summarization.messagesCount}
          reductionPercentage={summarization.reductionPercentage}
          error={summarization.error}
        />
      )}

      <Card className="p-4 space-y-4">
        {/* Usage bar */}
        <ContextUsageBar
          totalTokens={context.totalTokens}
          maxTokens={context.maxTokens}
          percentageUsed={context.percentageUsed}
          warningLevel={context.warningLevel}
        />

        {/* Token breakdown */}
        <ContextBreakdown
          tokensByRole={context.tokensByRole}
          totalTokens={context.totalTokens}
          messageCount={context.messageCount}
        />

        {/* Model info */}
        <ModelInfoPanel
          modelName={context.modelName}
          provider={context.provider}
          contextWindow={context.contextWindow}
          maxOutputTokens={context.maxOutputTokens}
          estimatedCost={context.estimatedCost}
        />

        {/* Additional stats */}
        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Available Tokens</div>
            <div className="font-semibold text-gray-900">
              {context.availableTokens.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Max Response</div>
            <div className="font-semibold text-gray-900">
              {context.maxResponseTokens.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
