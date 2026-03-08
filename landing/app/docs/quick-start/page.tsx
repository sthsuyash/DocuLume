"use client"

import { useLandingTheme } from '../../lib/useLandingTheme'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { Card, CardContent } from '../../components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function QuickStartPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

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
    <main className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/docs" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Quick Start Guide
          </h1>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Get up and running with DocuLume in 5 minutes
          </p>

          <div className="mt-12 space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-full font-bold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">{step.title}</h2>
                      <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step.description}
                      </p>
                      <pre className={`mt-4 overflow-x-auto rounded-lg p-4 text-sm ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Steps */}
          <Card className={`mt-12 ${isDark ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="size-6 shrink-0 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold">You're all set! 🎉</h3>
                  <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Next steps:
                  </p>
                  <ul className={`mt-3 space-y-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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

      <SiteFooter isDark={isDark} />
    </main>
  )
}
