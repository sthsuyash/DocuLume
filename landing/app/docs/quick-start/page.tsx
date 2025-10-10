"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function QuickStartPage() {
  const { isDark, toggle } = useTheme()

  const steps = [
    {
      title: 'Create Account',
      description: 'Sign up for DocuLume in 30 seconds',
      code: `# Visit https://app.doculume.com/register
# Or use the API:
curl -X POST https://api.doculume.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{
    "email": "you@company.com",
    "password": "secure_password",
    "full_name": "Your Name"
  }'

# Authentication cookie automatically set (httpOnly, secure)`,
    },
    {
      title: 'Configure API Keys',
      description: 'Add your LLM provider API key',
      code: `# Option 1: OpenAI
export OPENAI_API_KEY=sk-your-key-here

# Option 2: Anthropic Claude
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option 3: Local LLM (Ollama)
ollama pull llama2
export USE_LOCAL_LLM=true`,
    },
    {
      title: 'Upload Documents',
      description: 'Add your first document',
      code: `curl -X POST https://api.doculume.com/api/v1/documents/upload \\
  -b cookies.txt \\
  -F "file=@document.pdf"

# Cookie automatically sent - no Authorization header needed!`,
    },
    {
      title: 'Ask Questions',
      description: 'Start chatting with your documents',
      code: `curl -X POST https://api.doculume.com/api/v1/chat/ask \\
  -b cookies.txt \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is this document about?",
    "use_rag": true
  }'

# Authenticated via httpOnly cookie`,
    },
  ]

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/docs" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300">
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Quick Start Guide
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Get up and running with DocuLume in 5 minutes
          </p>

          <div className="mt-12 space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-white dark:bg-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">{step.title}</h2>
                      <p className="mt-2 text-slate-600 dark:text-slate-400">
                        {step.description}
                      </p>
                      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-12 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="size-6 shrink-0 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold">{"You're all set! 🎉"}</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Next steps:
                  </p>
                  <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-300">
                    <li>• <Link href="/docs/user/upload" className="text-blue-500 hover:underline">Learn about document upload best practices</Link></li>
                    <li>• <Link href="/docs/dev/llm-config" className="text-blue-500 hover:underline">Configure different LLM providers</Link></li>
                    <li>• <Link href="/docs/api" className="text-blue-500 hover:underline">Explore the full API reference</Link></li>
                    <li>• <Link href="/docs/videos" className="text-blue-500 hover:underline">Watch video tutorials</Link></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
