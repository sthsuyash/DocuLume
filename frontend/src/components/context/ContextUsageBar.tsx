/**
 * Real-time Context Usage Progress Bar
 * Shows token usage with color-coded warning levels
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface ContextUsageBarProps {
  totalTokens: number;
  maxTokens: number;
  percentageUsed: number;
  warningLevel: 'ok' | 'warning' | 'critical';
  className?: string;
}

export function ContextUsageBar({
  totalTokens,
  maxTokens,
  percentageUsed,
  warningLevel,
  className = '',
}: ContextUsageBarProps) {
  // Color schemes by warning level
  const colorSchemes = {
    ok: {
      bg: 'bg-green-100',
      fill: 'bg-gradient-to-r from-green-500 to-emerald-500',
      text: 'text-green-700',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    warning: {
      bg: 'bg-orange-100',
      fill: 'bg-gradient-to-r from-orange-500 to-amber-500',
      text: 'text-orange-700',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
    },
    critical: {
      bg: 'bg-red-100',
      fill: 'bg-gradient-to-r from-red-500 to-rose-500',
      text: 'text-red-700',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
  };

  const scheme = colorSchemes[warningLevel];
  const Icon = scheme.icon;

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with icon and status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${scheme.iconColor}`} />
          <span className="font-medium text-gray-700">
            Context Usage
          </span>
        </div>
        <div className={`font-semibold ${scheme.text}`}>
          {percentageUsed.toFixed(1)}%
        </div>
      </div>

      {/* Progress bar */}
      <div className={`relative h-3 rounded-full ${scheme.bg} overflow-hidden`}>
        <motion.div
          className={`h-full ${scheme.fill} rounded-full shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentageUsed, 100)}%` }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            mass: 0.5,
          }}
        />
      </div>

      {/* Token count */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          {formatNumber(totalTokens)} / {formatNumber(maxTokens)} tokens
        </span>
        {warningLevel === 'warning' && (
          <span className="text-orange-600 font-medium">
            Auto-summarization soon
          </span>
        )}
        {warningLevel === 'critical' && (
          <span className="text-red-600 font-medium animate-pulse">
            Near capacity!
          </span>
        )}
      </div>
    </div>
  );
}
