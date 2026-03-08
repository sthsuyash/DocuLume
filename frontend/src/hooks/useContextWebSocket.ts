/**
 * WebSocket hook for real-time context updates
 * Connects to backend WebSocket and manages context state
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ContextData, SummarizationState } from '@/components/context';

interface UseContextWebSocketOptions {
  conversationId: number;
  token: string;
  apiUrl?: string;
  autoReconnect?: boolean;
}

interface ContextUpdateEvent {
  type: 'context_update';
  data: {
    conversation_id: number;
    total_tokens: number;
    max_tokens: number;
    percentage_used: number;
    tokens_by_role: {
      system: number;
      user: number;
      assistant: number;
    };
    message_count: number;
    needs_summarization: boolean;
    available_tokens: number;
    max_response_tokens: number;
    estimated_cost: number;
    warning_level: 'ok' | 'warning' | 'critical';
  };
}

interface SummarizationStartedEvent {
  type: 'summarization_started';
  data: {
    conversation_id: number;
    messages_count: number;
    keep_recent: number;
  };
}

interface SummarizationCompleteEvent {
  type: 'summarization_complete';
  data: {
    conversation_id: number;
    new_token_count: number;
    old_token_count: number;
    reduction_percentage: number;
  };
}

type WebSocketEvent =
  | ContextUpdateEvent
  | SummarizationStartedEvent
  | SummarizationCompleteEvent;

export function useContextWebSocket({
  conversationId,
  token,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  autoReconnect = true,
}: UseContextWebSocketOptions) {
  const [context, setContext] = useState<ContextData | null>(null);
  const [summarization, setSummarization] = useState<SummarizationState>({
    status: 'idle',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsToken, setWsToken] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Get WebSocket token from backend (reads httpOnly cookie)
  useEffect(() => {
    const getWsToken = async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/ws-token`, {
          credentials: 'include', // Send cookies
        });

        if (!response.ok) {
          throw new Error('Failed to get WebSocket token');
        }

        const data = await response.json();
        setWsToken(data.token);
      } catch (err) {
        console.error('Error getting WebSocket token:', err);
        setError(err instanceof Error ? err.message : 'Failed to authenticate');
      }
    };

    getWsToken();
  }, [apiUrl]);

  // Fetch initial context data
  const fetchInitialContext = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiUrl}/chat/conversations/${conversationId}/context`,
        {
          credentials: 'include', // Cookies sent automatically
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch initial context');
      }

      const data = await response.json();

      setContext({
        totalTokens: data.total_tokens,
        maxTokens: data.max_tokens,
        percentageUsed: data.percentage_used,
        tokensByRole: data.tokens_by_role,
        messageCount: data.message_count,
        warningLevel: data.warning_level,
        availableTokens: data.available_tokens,
        maxResponseTokens: data.max_response_tokens,
        estimatedCost: data.estimated_cost,
        modelName: data.model_name,
        provider: data.provider,
        contextWindow: data.context_window,
        maxOutputTokens: data.max_output_tokens,
      });
    } catch (err) {
      console.error('Error fetching initial context:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [conversationId, apiUrl]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!wsToken) {
      console.log('Waiting for WebSocket token...');
      return;
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(
      `${wsUrl}/ws/context/${conversationId}?token=${wsToken}`
    );

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      // Request initial update
      ws.send(JSON.stringify({ type: 'request_update' }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketEvent = JSON.parse(event.data);

        switch (message.type) {
          case 'context_update': {
            const data = message.data;
            setContext((prev) => ({
              ...prev!,
              totalTokens: data.total_tokens,
              maxTokens: data.max_tokens,
              percentageUsed: data.percentage_used,
              tokensByRole: data.tokens_by_role,
              messageCount: data.message_count,
              warningLevel: data.warning_level,
              availableTokens: data.available_tokens,
              maxResponseTokens: data.max_response_tokens,
              estimatedCost: data.estimated_cost,
            }));
            break;
          }

          case 'summarization_started': {
            setSummarization({
              status: 'summarizing',
              messagesCount: message.data.messages_count,
            });
            break;
          }

          case 'summarization_complete': {
            setSummarization({
              status: 'complete',
              reductionPercentage: message.data.reduction_percentage,
            });

            // Auto-hide after 5 seconds
            setTimeout(() => {
              setSummarization({ status: 'idle' });
            }, 5000);
            break;
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);

      // Auto-reconnect with exponential backoff
      if (autoReconnect && reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;

        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [conversationId, wsToken, apiUrl, autoReconnect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Send ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Initialize connection and fetch initial data
  useEffect(() => {
    // Only connect if we have a valid conversation ID (greater than 0)
    if (!wsToken || !conversationId || conversationId === 0) return;

    fetchInitialContext();
    connect();

    return () => {
      disconnect();
    };
  }, [fetchInitialContext, connect, disconnect, wsToken, conversationId]);

  return {
    context,
    summarization,
    isConnected,
    error,
    reconnect: connect,
    disconnect,
  };
}
