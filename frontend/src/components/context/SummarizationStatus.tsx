/**
 * Summarization Status Indicator
 * Shows when conversation summarization is happening
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface SummarizationStatusProps {
  status: 'idle' | 'summarizing' | 'complete' | 'error';
  messagesCount?: number;
  reductionPercentage?: number;
  error?: string;
  className?: string;
}

export function SummarizationStatus({
  status,
  messagesCount,
  reductionPercentage,
  error,
  className = '',
}: SummarizationStatusProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className={className}>
      {/* Summarizing */}
      {status === 'summarizing' && (
        <Alert className="bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center gap-2">
              <span className="font-medium">Summarizing conversation...</span>
              {messagesCount && (
                <span className="text-sm text-blue-600">
                  ({messagesCount} messages)
                </span>
              )}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Compressing context to make room for more messages
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Complete */}
      {status === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-green-500" />
                <span className="font-medium">Summarization complete!</span>
              </div>
              {reductionPercentage !== undefined && (
                <div className="text-xs text-green-600 mt-1">
                  Reduced context by {reductionPercentage.toFixed(1)}% - you have more room for conversation
                </div>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Error */}
      {status === 'error' && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium">Summarization failed</div>
            {error && (
              <div className="text-xs text-red-600 mt-1">{error}</div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
