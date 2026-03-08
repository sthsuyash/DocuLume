"use client"

import { useLandingTheme } from '../../lib/useLandingTheme'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { Card, CardContent } from '../../components/ui/card'
import { ArrowLeft, Zap, Shield, Cloud, Code, MessageSquare, FileText } from 'lucide-react'
import Link from 'next/link'

export default function OverviewPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const features = [
    {
      icon: FileText,
      title: 'Document Processing',
      description: 'Upload PDFs, DOCX, TXT, and more. Documents are automatically processed, chunked, and vectorized for intelligent search.',
      color: 'blue'
    },
    {
      icon: MessageSquare,
      title: 'AI-Powered Chat',
      description: 'Ask questions in natural language. Our RAG pipeline retrieves relevant context and generates accurate answers with source citations.',
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Universal LLM Support',
      description: 'Use any AI model - OpenAI, Anthropic, Google, or local models like Ollama. Switch providers anytime without data migration.',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SOC 2 compliance, role-based access control, and audit logging. Your data stays secure.',
      color: 'red'
    },
    {
      icon: Cloud,
      title: 'Flexible Deployment',
      description: 'Cloud-hosted, self-hosted, or on-premise. Deploy on AWS, GCP, Azure, or your own infrastructure.',
      color: 'orange'
    },
    {
      icon: Code,
      title: 'Developer-Friendly',
      description: 'Complete REST API, WebSocket support, Python & JavaScript SDKs. Integrate DocuLume into your applications.',
      color: 'indigo'
    }
  ]

  const howItWorks = [
    {
      step: 1,
      title: 'Upload Documents',
      description: 'Drag and drop your files or use the API. Supports PDF, DOCX, TXT, Markdown, and more.',
      details: ['Automatic format detection', 'OCR for scanned PDFs', 'Batch upload support']
    },
    {
      step: 2,
      title: 'Processing & Indexing',
      description: 'Documents are automatically chunked, embedded using state-of-the-art models, and stored in a vector database.',
      details: ['Smart chunking algorithms', 'Semantic embeddings', 'Fast vector search (pgvector)']
    },
    {
      step: 3,
      title: 'Ask Questions',
      description: 'Chat with your documents using natural language. Get instant answers with source citations.',
      details: ['RAG pipeline', 'Context-aware responses', 'Source attribution']
    },
    {
      step: 4,
      title: 'Collaborate & Share',
      description: 'Share conversations, export to PDF/JSON, and collaborate with your team.',
      details: ['Conversation sharing', 'Export options', 'Team workspaces']
    }
  ]

  const useCases = [
    {
      title: 'Legal Research',
      description: 'Search through thousands of legal documents, contracts, and case files instantly.',
      example: '"Find all clauses related to intellectual property in my contracts"'
    },
    {
      title: 'Customer Support',
      description: 'Enable support teams to quickly find answers from product documentation and knowledge bases.',
      example: '"How do I reset a user password in the admin panel?"'
    },
    {
      title: 'Research & Academia',
      description: 'Analyze research papers, thesis documents, and academic literature efficiently.',
      example: '"What are the key findings about climate change in these papers?"'
    },
    {
      title: 'Business Intelligence',
      description: 'Extract insights from reports, financial documents, and business proposals.',
      example: '"Summarize Q3 revenue trends across all regional reports"'
    }
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
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/docs" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to documentation
          </Link>

          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Platform Overview
            </h1>
            <p className={`mt-4 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to know about DocuLume
            </p>
          </div>

          {/* What is DocuLume */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">What is DocuLume?</h2>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                DocuLume is an <strong>AI-powered document intelligence platform</strong> that lets you chat with your documents using natural language.
                Upload any document, ask questions, and get instant answers with source citations.
              </p>
              <p className={`mt-4 text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Built on cutting-edge Retrieval-Augmented Generation (RAG) technology, DocuLume combines the power of large language models
                with intelligent document search to provide accurate, context-aware responses.
              </p>
            </CardContent>
          </Card>

          {/* Core Features */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Core Features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                    <CardContent className="p-6">
                      <div className={`inline-flex p-3 rounded-lg mb-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <Icon className={`size-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">How It Works</h2>
            <div className="space-y-6">
              {howItWorks.map((item) => (
                <Card key={item.step} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className={`flex-shrink-0 flex items-center justify-center size-12 rounded-full font-bold text-lg ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                        <p className={`mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.description}
                        </p>
                        <ul className={`space-y-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
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

          {/* Use Cases */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold mb-6">Use Cases</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {useCases.map((useCase) => (
                <Card key={useCase.title} className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                    <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {useCase.description}
                    </p>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`text-sm italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Example: "{useCase.example}"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <Card className={`mb-12 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Backend</h3>
                  <ul className={`space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>• FastAPI (Python async)</li>
                    <li>• PostgreSQL + pgvector</li>
                    <li>• Redis (caching & rate limiting)</li>
                    <li>• LangChain (RAG pipeline)</li>
                    <li>• OpenAI / Anthropic / Google APIs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Frontend</h3>
                  <ul className={`space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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

          {/* Next Steps */}
          <Card className={`${isDark ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Ready to get started?</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/docs/quick-start" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Quick Start Guide
                </Link>
                <Link href={appUrl} className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                  Try it now
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
