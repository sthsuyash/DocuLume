'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, AlertCircle, Settings, Zap } from 'lucide-react'
import { AddProviderModal } from '@/components/settings/AddProviderModal'
import apiClient from '@/lib/api/client'

interface LLMProvider {
  type: string
  base_url?: string
  model: string
  timeout?: number
  max_retries?: number
}

interface LLMConfig {
  default_provider: string | null
  providers: Record<string, LLMProvider>
  fallback_order: string[]
  cost_limits: Record<string, any>
}

export default function LLMSettingsPage() {
  const [config, setConfig] = useState<LLMConfig>({
    default_provider: null,
    providers: {},
    fallback_order: [],
    cost_limits: {}
  })
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({})

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await apiClient.get('/settings/llm')
      setConfig(response.data)
    } catch (error) {
      console.error('Failed to fetch LLM config:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProvider = async (providerName: string) => {
    if (!confirm(`Delete provider "${providerName}"?`)) return

    try {
      await apiClient.delete(`/settings/llm/provider/${providerName}`)
      await fetchConfig()
    } catch (error: any) {
      console.error('Failed to delete provider:', error)
      alert(error?.response?.data?.detail || 'Failed to delete provider')
    }
  }

  const setDefaultProvider = async (providerName: string) => {
    try {
      await apiClient.patch('/settings/llm/default', { default_provider: providerName })
      await fetchConfig()
    } catch (error: any) {
      console.error('Failed to set default provider:', error)
      alert(error?.response?.data?.detail || 'Failed to set default provider')
    }
  }

  const testProvider = async (providerName: string) => {
    setTestingProvider(providerName)
    const provider = config.providers[providerName]

    try {
      const response = await apiClient.post('/settings/llm/test', {
        provider_name: providerName,
        config: provider
      })

      setTestResults(prev => ({
        ...prev,
        [providerName]: {
          success: response.data.success,
          error: response.data.error
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerName]: {
          success: false,
          error: 'Connection failed'
        }
      }))
    } finally {
      setTestingProvider(null)
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'openai':
        return '🤖'
      case 'anthropic':
        return '🧠'
      case 'google':
        return '🔍'
      case 'ollama':
        return '🦙'
      case 'lmstudio':
        return '🎨'
      default:
        return '⚡'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8" />
          LLM Provider Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure which AI models to use for chat. Supports OpenAI, Anthropic, Google, and local LLMs like Ollama.
        </p>
      </div>

      {/* Add Provider Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Provider
        </button>
      </div>

      {/* Providers List */}
      <div className="space-y-4">
        {Object.keys(config.providers).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No LLM providers configured yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click "Add Provider" to get started.</p>
          </div>
        ) : (
          Object.entries(config.providers).map(([name, provider]) => (
            <div
              key={name}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Icon */}
                  <div className="text-4xl">{getProviderIcon(provider.type)}</div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {name}
                      </h3>
                      {config.default_provider === name && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Type:</strong> {provider.type}</p>
                      <p><strong>Model:</strong> {provider.model}</p>
                      {provider.base_url && (
                        <p><strong>URL:</strong> {provider.base_url}</p>
                      )}
                      <p><strong>Timeout:</strong> {provider.timeout || 60}s</p>
                    </div>

                    {/* Test Result */}
                    {testResults[name] && (
                      <div className={`mt-3 flex items-center gap-2 text-sm ${
                        testResults[name].success
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {testResults[name].success ? (
                          <>
                            <Check className="w-4 h-4" />
                            Connection successful
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            {testResults[name].error || 'Connection failed'}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => testProvider(name)}
                    disabled={testingProvider === name}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {testingProvider === name ? 'Testing...' : 'Test'}
                  </button>

                  {config.default_provider !== name && (
                    <button
                      onClick={() => setDefaultProvider(name)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Set Default
                    </button>
                  )}

                  <button
                    onClick={() => deleteProvider(name)}
                    disabled={config.default_provider === name}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={config.default_provider === name ? 'Cannot delete default provider' : 'Delete provider'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Supported Providers
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>OpenAI:</strong> GPT-3.5, GPT-4</li>
          <li>• <strong>Anthropic:</strong> Claude 3 (Opus, Sonnet, Haiku)</li>
          <li>• <strong>Google:</strong> Gemini Pro</li>
          <li>• <strong>Ollama:</strong> Local models (Llama 2, Mistral, etc.)</li>
          <li>• <strong>LM Studio:</strong> Local OpenAI-compatible server</li>
          <li>• <strong>Custom:</strong> Any OpenAI-compatible API endpoint</li>
        </ul>
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <AddProviderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchConfig()
          }}
        />
      )}
    </div>
  )
}
