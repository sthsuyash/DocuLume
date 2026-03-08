/**
 * Context Token Breakdown by Role
 * Shows detailed breakdown of tokens by message role
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, User, Bot, Settings } from 'lucide-react';
import { Card } from '../ui/card';

interface TokensByRole {
  system: number;
  user: number;
  assistant: number;
}

interface ContextBreakdownProps {
  tokensByRole: TokensByRole;
  totalTokens: number;
  messageCount: number;
  className?: string;
}

export function ContextBreakdown({
  tokensByRole,
  totalTokens,
  messageCount,
  className = '',
}: ContextBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const roleConfig = {
    system: {
      label: 'System',
      icon: Settings,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-700',
    },
    user: {
      label: 'User',
      icon: User,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    assistant: {
      label: 'Assistant',
      icon: Bot,
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
  };

  const calculatePercentage = (tokens: number) => {
    return totalTokens > 0 ? (tokens / totalTokens) * 100 : 0;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <span>Token Breakdown</span>
          <span className="text-xs text-gray-500">
            ({messageCount} messages)
          </span>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-3">
              {Object.entries(tokensByRole).map(([role, tokens]) => {
                const config = roleConfig[role as keyof TokensByRole];
                const Icon = config.icon;
                const percentage = calculatePercentage(tokens);

                return (
                  <div key={role} className="space-y-2">
                    {/* Role header */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${config.lightColor}`}>
                          <Icon className={`h-3.5 w-3.5 ${config.textColor}`} />
                        </div>
                        <span className="font-medium text-gray-700">
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${config.textColor}`}>
                          {formatNumber(tokens)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${config.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          type: 'spring',
                          stiffness: 100,
                          damping: 15,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-gray-700">Total Tokens</span>
                  <span className="text-gray-900">
                    {formatNumber(totalTokens)}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
