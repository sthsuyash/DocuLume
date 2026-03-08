/**
 * Model Information Panel
 * Displays current LLM model and its context limits
 */

import React from 'react';
import { Brain, Zap, DollarSign } from 'lucide-react';
import { Card } from '../ui/card';

interface ModelInfoPanelProps {
  modelName: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  estimatedCost?: number;
  className?: string;
}

export function ModelInfoPanel({
  modelName,
  provider,
  contextWindow,
  maxOutputTokens,
  estimatedCost,
  className = '',
}: ModelInfoPanelProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'text-emerald-600';
      case 'anthropic':
        return 'text-orange-600';
      case 'google':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* Model name */}
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-gray-600" />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {modelName}
            </div>
            <div className={`text-xs font-medium ${getProviderColor(provider)}`}>
              {provider.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Context Window</div>
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              <Zap className="h-3 w-3 text-blue-500" />
              {formatNumber(contextWindow)} tokens
            </div>
          </div>

          <div>
            <div className="text-gray-500 mb-1">Max Output</div>
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              <Zap className="h-3 w-3 text-purple-500" />
              {formatNumber(maxOutputTokens)} tokens
            </div>
          </div>

          {estimatedCost !== undefined && (
            <div className="col-span-2">
              <div className="text-gray-500 mb-1">Estimated Cost</div>
              <div className="flex items-center gap-1 font-semibold text-gray-900">
                <DollarSign className="h-3 w-3 text-green-500" />
                ${estimatedCost.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
