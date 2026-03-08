"use client"

import { useLandingTheme } from '../lib/useLandingTheme'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { ExpandedFeatures } from '../components/ExpandedFeatures'
import { ArrowLeft, Zap, Shield, Database, Cloud, Sparkles, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export default function FeaturesPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  const detailedFeatures = [
    {
      category: 'Document Processing',
      icon: Database,
      features: [
        { name: 'Multi-format support', desc: 'PDF, DOCX, TXT, MD, CSV, and more' },
        { name: 'Smart chunking', desc: 'Intelligent text segmentation for optimal retrieval' },
        { name: 'Automatic indexing', desc: 'Real-time vector embedding generation' },
        { name: 'Batch processing', desc: 'Upload thousands of documents simultaneously' },
      ],
    },
    {
      category: 'AI & Search',
      icon: Sparkles,
      features: [
        { name: 'Semantic search', desc: 'Find by meaning, not just keywords' },
        { name: 'Multi-model support', desc: 'OpenAI, Anthropic, Google - your choice' },
        { name: 'Context-aware RAG', desc: 'Grounded answers with source citations' },
        { name: 'Conversational AI', desc: 'Natural follow-up questions' },
      ],
    },
    {
      category: 'Performance',
      icon: Zap,
      features: [
        { name: 'Sub-second queries', desc: 'Optimized vector search engine' },
        { name: 'Scalable architecture', desc: 'Handle millions of documents' },
        { name: 'Caching layer', desc: 'Smart caching for frequent queries' },
        { name: '99.99% uptime', desc: 'Enterprise SLA guarantee' },
      ],
    },
    {
      category: 'Security & Compliance',
      icon: Shield,
      features: [
        { name: 'End-to-end encryption', desc: '256-bit AES encryption at rest and in transit' },
        { name: 'SOC 2 Type II', desc: 'Certified security controls' },
        { name: 'GDPR compliant', desc: 'Full data privacy compliance' },
        { name: 'Role-based access', desc: 'Granular permission controls' },
      ],
    },
    {
      category: 'Deployment Options',
      icon: Cloud,
      features: [
        { name: 'Cloud-hosted', desc: 'Managed infrastructure, zero ops' },
        { name: 'Private cloud', desc: 'Dedicated VPC in your region' },
        { name: 'On-premise', desc: 'Full control, air-gapped deployment' },
        { name: 'Hybrid', desc: 'Mix cloud and on-prem as needed' },
      ],
    },
    {
      category: 'Developer Experience',
      icon: Lock,
      features: [
        { name: 'RESTful API', desc: 'Full-featured HTTP API' },
        { name: 'SDKs', desc: 'Python, JavaScript, Go libraries' },
        { name: 'Webhooks', desc: 'Real-time event notifications' },
        { name: 'Comprehensive docs', desc: 'Examples, tutorials, API reference' },
      ],
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

      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Every feature you need.<br />Nothing you don't.
            </h1>
            <p className={`mt-6 max-w-2xl text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Production-ready RAG platform with enterprise security, multi-model support, and developer-friendly APIs. Built for teams that ship fast.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview Grid */}
      <ExpandedFeatures isDark={isDark} />

      {/* Detailed Feature Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Deep dive into features</h2>
            <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Comprehensive capabilities across every layer of the stack
            </p>
          </div>

          <div className="space-y-8">
            {detailedFeatures.map((category, idx) => {
              const Icon = category.icon
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className={isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 items-center justify-center rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                          <Icon className="size-5" />
                        </div>
                        <CardTitle className="text-xl">{category.category}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {category.features.map((feature) => (
                          <div key={feature.name} className={`rounded-lg border p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
                            <h4 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{feature.name}</h4>
                            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feature.desc}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-20 ${isDark ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-semibold">Ready to experience the difference?</h2>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Start your free trial today. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={appUrl}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Start Free Trial
              </motion.button>
            </a>
            <Link href="/contact">
              <button className={`rounded-lg px-8 py-3 font-semibold ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                Talk to Sales
              </button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter isDark={isDark} />
    </main>
  )
}
