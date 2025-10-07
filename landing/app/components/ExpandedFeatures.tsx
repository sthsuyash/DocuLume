"use client"

import { motion } from 'framer-motion'
import {
  FileText, Sparkles, Lock, Zap, Search, Globe, BarChart3, Users, Code,
} from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'

const features = [
  { title: 'Fast document ingestion',   description: 'Upload PDFs, DOCX, Markdown, and TXT with automatic chunking and indexing.',                      icon: FileText  },
  { title: 'Context-aware answers',     description: 'Grounded responses powered by a production-ready RAG pipeline — not hallucinations.',              icon: Sparkles  },
  { title: 'Enterprise security',       description: 'JWT auth, role-based access, encrypted storage, and HIPAA/GDPR-ready by default.',                 icon: Lock      },
  { title: 'Sub-second search',         description: 'Hybrid kNN + BM25 vector search delivers results in under 200ms at any scale.',                    icon: Zap       },
  { title: 'Semantic understanding',    description: 'Find answers by meaning, not keywords. Natural language queries just work.',                        icon: Search    },
  { title: 'Multi-model support',       description: 'Choose from OpenAI, Anthropic, or Google models. Switch models without re-indexing.',              icon: Globe     },
  { title: 'Usage analytics',          description: 'Track query volume, cost per request, and answer quality with built-in dashboards.',                icon: BarChart3 },
  { title: 'Team collaboration',        description: 'Share conversations, export citations, and build a shared knowledge layer.',                        icon: Users     },
  { title: 'Developer-friendly API',   description: 'RESTful API, webhooks, and SDKs for embedding DocuLume into any workflow.',                        icon: Code      },
]

export function ExpandedFeatures() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 md:py-20">
      <div className="mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything your team needs
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Not a demo wrapper. A production-grade document intelligence platform.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full border-slate-200 bg-white text-slate-900 transition-all hover:border-blue-500/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <CardHeader>
                  <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
