"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Cloud, Server, Zap } from 'lucide-react'
import Link from 'next/link'

export default function LLMConfigPage() {
  const { isDark, toggle } = useTheme()

  const providers = [
    {
      name: 'OpenAI',
      icon: Cloud,
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
      setup: `# Install SDK
pip install openai

# Set API key
export OPENAI_API_KEY=sk-your-key-here

# In DocuLume settings
# Navigate to Settings → API Keys → OpenAI
# Enter your API key and select default model`,
      code: `from app.core.llm.provider import OpenAIProvider

llm = OpenAIProvider(
    api_key="sk-your-key",
    model="gpt-4-turbo-preview"
)

response = await llm.chat(messages=[
    {"role": "user", "content": "What is RAG?"}
])`,
    },
    {
      name: 'Anthropic Claude',
      icon: Cloud,
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      setup: `# Install SDK
pip install anthropic

# Set API key
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# In DocuLume settings
# Navigate to Settings → API Keys → Anthropic
# Enter your API key and select default model`,
      code: `from app.core.llm.provider import AnthropicProvider

llm = AnthropicProvider(
    api_key="sk-ant-your-key",
    model="claude-3-sonnet-20240229"
)

response = await llm.chat(messages=[
    {"role": "user", "content": "Explain RAG"}
])`,
    },
    {
      name: 'Google Gemini',
      icon: Cloud,
      models: ['gemini-pro', 'gemini-pro-vision'],
      setup: `# Install SDK
pip install google-generativeai

# Set API key
export GOOGLE_API_KEY=your-google-api-key

# In DocuLume settings
# Navigate to Settings → API Keys → Google
# Enter your API key and select default model`,
      code: `from app.core.llm.provider import GoogleProvider

llm = GoogleProvider(
    api_key="your-key",
    model="gemini-pro"
)

response = await llm.chat(messages=[
    {"role": "user", "content": "What is vector search?"}
])`,
    },
    {
      name: 'Local LLM (Ollama)',
      icon: Server,
      models: ['llama2', 'mistral', 'codellama', 'any model'],
      setup: `# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Start server
ollama serve  # Runs on http://localhost:11434

# Configure DocuLume
export USE_LOCAL_LLM=true
export LOCAL_LLM_URL=http://localhost:11434
export LOCAL_LLM_MODEL=llama2`,
      code: `# Option 1: Custom Provider (see full docs)
from app.core.llm.local_provider import OllamaProvider

llm = OllamaProvider(
    base_url="http://localhost:11434",
    model="llama2"
)

# Option 2: OpenAI-compatible
from app.core.llm.provider import OpenAIProvider

llm = OpenAIProvider(api_key="not-needed", model="llama2")
llm.client.base_url = "http://localhost:11434/v1"`,
    },
  ]

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/docs" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300">
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            LLM Configuration
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Configure any LLM provider - cloud or local
          </p>

          <Card className="mt-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Zap className="size-6 shrink-0 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold">Multi-Provider Support</h3>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">
                    DocuLume supports OpenAI, Anthropic, Google, and local LLMs. You can switch between providers anytime without data migration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 space-y-8">
            {providers.map((provider) => {
              const Icon = provider.icon
              return (
                <Card key={provider.name} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                        <Icon className="size-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{provider.name}</CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Models: {provider.models.join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-semibold">Setup Instructions:</h4>
                      <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        <code>{provider.setup}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">Code Example:</h4>
                      <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        <code>{provider.code}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-semibold">Provider Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg bg-white dark:bg-slate-900">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 text-left">Provider</th>
                    <th className="p-4 text-left">Speed</th>
                    <th className="p-4 text-left">Cost</th>
                    <th className="p-4 text-left">Context</th>
                    <th className="p-4 text-left">Privacy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="p-4">OpenAI GPT-4</td>
                    <td className="p-4">⚡⚡</td>
                    <td className="p-4">$$$</td>
                    <td className="p-4">128k</td>
                    <td className="p-4">☁️ Cloud</td>
                  </tr>
                  <tr>
                    <td className="p-4">Claude 3</td>
                    <td className="p-4">⚡⚡⚡</td>
                    <td className="p-4">$$</td>
                    <td className="p-4">200k</td>
                    <td className="p-4">☁️ Cloud</td>
                  </tr>
                  <tr>
                    <td className="p-4">Gemini Pro</td>
                    <td className="p-4">⚡⚡⚡</td>
                    <td className="p-4">$</td>
                    <td className="p-4">32k</td>
                    <td className="p-4">☁️ Cloud</td>
                  </tr>
                  <tr>
                    <td className="p-4">Local (Ollama)</td>
                    <td className="p-4">⚡</td>
                    <td className="p-4">Free</td>
                    <td className="p-4">Varies</td>
                    <td className="p-4">🔒 Private</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <Card className="mt-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Next Steps</h3>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li>• <Link href="/docs/quick-start" className="text-blue-500 hover:underline">Complete the quick start guide</Link></li>
                <li>• <Link href="/docs/api" className="text-blue-500 hover:underline">Explore the API reference</Link></li>
                <li>• <Link href="/docs/dev/self-host" className="text-blue-500 hover:underline">Learn about self-hosting</Link></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
