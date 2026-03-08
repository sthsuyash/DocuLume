'use client'

import { useState, useEffect } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/api/client'

interface ProviderPreset {
  type: string
  base_url?: string
  model: string
  models?: string[]
  api_key?: string
  timeout: number
  max_retries: number
}

interface AddProviderModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddProviderModal({ onClose, onSuccess }: AddProviderModalProps) {
  const [providerName, setProviderName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [config, setConfig] = useState<ProviderPreset>({
    type: 'custom',
    base_url: '',
    model: '',
    api_key: '',
    timeout: 60,
    max_retries: 2
  })
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  const presets: Record<string, ProviderPreset> = {
    ollama: {
      type: 'ollama',
      base_url: 'http://localhost:11434/v1',
      model: 'llama2',
      models: ['llama2', 'mistral', 'codellama', 'neural-chat', 'starling-lm'],
      api_key: 'not-needed',
      timeout: 60,
      max_retries: 2
    },
    lmstudio: {
      type: 'lmstudio',
      base_url: 'http://localhost:1234/v1',
      model: 'local-model',
      models: ['local-model'],
      api_key: 'not-needed',
      timeout: 60,
      max_retries: 2
    },
    openai: {
      type: 'openai',
      model: 'gpt-3.5-turbo',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview', 'gpt-4o'],
      api_key: '',
      timeout: 60,
      max_retries: 2
    },
    anthropic: {
      type: 'anthropic',
      model: 'claude-3-haiku-20240307',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      api_key: '',
      timeout: 60,
      max_retries: 2
    },
    google: {
      type: 'google',
      model: 'gemini-pro',
      models: ['gemini-pro', 'gemini-pro-vision'],
      api_key: '',
      timeout: 60,
      max_retries: 2
    }
  }

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    if (preset && presets[preset]) {
      setConfig(presets[preset])
      setProviderName(preset)
    } else {
      setConfig({
        type: 'custom',
        base_url: '',
        model: '',
        api_key: '',
        timeout: 60,
        max_retries: 2
      })
    }
    setTestResult(null)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await apiClient.post('/settings/llm/test', {
        provider_name: providerName,
        config: config
      })

      setTestResult({
        success: response.data.success,
        error: response.data.error
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Connection failed'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!providerName.trim()) {
      alert('Provider name is required')
      return
    }

    if (!config.model) {
      alert('Model is required')
      return
    }

    if (config.type in ['openai', 'anthropic', 'google'] && !config.api_key) {
      alert('API key is required for cloud providers')
      return
    }

    if (config.type in ['ollama', 'lmstudio', 'vllm', 'custom'] && !config.base_url) {
      alert('Base URL is required for local/custom providers')
      return
    }

    setSaving(true)

    try {
      await apiClient.post('/settings/llm/provider', {
        provider_name: providerName,
        config: config
      })
      onSuccess()
    } catch (error: any) {
      console.error('Failed to add provider:', error)
      alert(error?.response?.data?.detail || 'Failed to add provider')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add LLM Provider
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Provider Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="my-ollama, personal-openai, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Preset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Preset (Optional)
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Custom Configuration</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="lmstudio">LM Studio (Local)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="google">Google Gemini</option>
            </select>
          </div>

          {/* Provider Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider Type <span className="text-red-500">*</span>
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio</option>
              <option value="vllm">vLLM</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Base URL (for local/custom providers) */}
          {['ollama', 'lmstudio', 'vllm', 'custom'].includes(config.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.base_url || ''}
                onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                placeholder="http://localhost:11434/v1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be an OpenAI-compatible API endpoint
              </p>
            </div>
          )}

          {/* API Key (for cloud providers) */}
          {['openai', 'anthropic', 'google'].includes(config.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={config.api_key || ''}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your API key will be encrypted before storage
              </p>
            </div>
          )}

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            {selectedPreset && presets[selectedPreset]?.models ? (
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {presets[selectedPreset].models!.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder="gpt-3.5-turbo, llama2, etc."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                min="10"
                max="300"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                value={config.max_retries}
                onChange={(e) => setConfig({ ...config, max_retries: parseInt(e.target.value) })}
                min="0"
                max="5"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <>
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Connection successful!
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-red-800 dark:text-red-200 font-medium">
                      {testResult.error || 'Connection failed'}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Provider'}
          </button>
        </div>
      </div>
    </div>
  )
}
