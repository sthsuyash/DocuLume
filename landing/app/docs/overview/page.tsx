"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Zap, Shield, Cloud, Code, MessageSquare, FileText } from 'lucide-react'
import Link from 'next/link'
import { APP_URL } from '@/lib/config'

export default function OverviewPage() {
  const { isDark, toggle } = useTheme()

  const features = [
    { icon: FileText, title: 'Document Processing', description: 'Upload PDFs, DOCX, TXT, and more. Documents are automatically processed, chunked, and vectorized for intelligent search.' },
    { icon: MessageSquare, title: 'AI-Powered Chat', description: 'Ask questions in natural language. Our RAG pipeline retrieves relevant context and generates accurate answers with source citations.' },
    { icon: Zap, title: 'Universal LLM Support', description: 'Use any AI model - OpenAI, Anthropic, Google, or local models like Ollama. Switch providers anytime without data migration.' },
    { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption, SOC 2 compliance, role-based access control, and audit logging. Your data stays secure.' },
    { icon: Cloud, title: 'Flexible Deployment', description: 'Cloud-hosted, self-hosted, or on-premise. Deploy on AWS, GCP, Azure, or your own infrastructure.' },
    { icon: Code, title: 'Developer-Friendly', description: 'Complete REST API, WebSocket support, Python & JavaScript SDKs. Integrate DocuLume into your applications.' }
  ]

  const howItWorks = [
    { step: 1, title: 'Upload Documents', description: 'Drag and drop your files or use the API. Supports PDF, DOCX, TXT, Markdown, and more.', details: ['Automatic format detection', 'OCR for scanned PDFs', 'Batch upload support'] },
    { step: 2, title: 'Processing & Indexing', description: 'Documents are automatically chunked, embedded using state-of-the-art models, and stored in a vector database.', details: ['Smart chunking algorithms', 'Semantic embeddings', 'Fast vector search (pgvector)'] },
    { step: 3, title: 'Ask Questions', description: 'Chat with your documents using natural language. Get instant answers with source citations.', details: ['RAG pipeline', 'Context-aware responses', 'Source attribution'] },
    { step: 4, title: 'Collaborate & Share', description: 'Share conversations, export to PDF/JSON, and collaborate with your team.', details: ['Conversation sharing', 'Export options', 'Team workspaces'] }
  ]

  const useCases = [
    { title: 'Legal Research', description: 'Search through thousands of legal documents, contracts, and case files instantly.', example: 'Find all clauses related to intellectual property in my contracts' },
    { title: 'Customer Support', description: 'Enable support teams to quickly find answers from product documentation and knowledge bases.', example: 'How do I reset a user password in the admin panel?' },
    { title: 'Research & Academia', description: 'Analyze research papers, thesis documents, and academic literature efficiently.', example: 'What are the key findings about climate change in these papers?' },
    { title: 'Business Intelligence', description: 'Extract insights from reports, financial documents, and business proposals.', example: 'Summarize Q3 revenue trends across all regional reports' }
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

          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Platform Overview</h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Everything you need to know about DocuLume
            </p>
          </div>

          <Card className="mb-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-semibold">What is DocuLume?</h2>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                DocuLume is an <strong>AI-powered document intelligence platform</strong> that lets you chat with your documents using natural language.
                Upload any document, ask questions, and get instant answers with source citations.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                Built on cutting-edge Retrieval-Augmented Generation (RAG) technology, DocuLume combines the power of large language models
                with intelligent document search to provide accurate, context-aware responses.
              </p>
            </CardContent>
          </Card>

          <div className="mb-12">
            <h2 className="mb-6 text-3xl font-semibold">Core Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                        <Icon className="size-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="mb-6 text-3xl font-semibold">How It Works</h2>
            <div className="space-y-6">
              {howItWorks.map((item) => (
                <Card key={item.step} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white dark:bg-blue-600">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                        <p className="mb-3 text-slate-600 dark:text-slate-400">{item.description}</p>
                        <ul className="space-y-1 text-sm text-slate-500">
                          {item.details.map((detail) => (
                            <li key={detail}>✓ {detail}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="mb-6 text-3xl font-semibold">Use Cases</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {useCases.map((useCase) => (
                <Card key={useCase.title} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-xl font-semibold">{useCase.title}</h3>
                    <p className="mb-4 text-slate-600 dark:text-slate-400">{useCase.description}</p>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-sm italic text-slate-600 dark:text-slate-400">
                        Example: &ldquo;{useCase.example}&rdquo;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mb-12 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-semibold">Technology Stack</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold text-blue-600 dark:text-blue-400">Backend</h3>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• FastAPI (Python async)</li>
                    <li>• PostgreSQL + pgvector</li>
                    <li>• Redis (caching & rate limiting)</li>
                    <li>• LangChain (RAG pipeline)</li>
                    <li>• OpenAI / Anthropic / Google APIs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-blue-600 dark:text-blue-400">Frontend</h3>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• Next.js 14 (React)</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• WebSocket (real-time chat)</li>
                    <li>• Responsive design</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Ready to get started?</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/docs/quick-start" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700">
                  Quick Start Guide
                </Link>
                <Link href={APP_URL} className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-slate-900 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  Try it now
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
