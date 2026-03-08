"use client"

import { motion } from 'framer-motion'
import {
  FileText,
  Sparkles,
  Lock,
  Zap,
  Search,
  Globe,
  BarChart3,
  Users,
  Code,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const features = [
  {
    title: 'Fast document ingestion',
    description: 'Upload PDFs, DOCX, Markdown, and TXT with automatic chunking and indexing.',
    icon: FileText,
    color: 'blue',
  },
  {
    title: 'Context-aware answers',
    description: 'Grounded responses powered by production-ready RAG pipelines.',
    icon: Sparkles,
    color: 'purple',
  },
  {
    title: 'Enterprise security',
    description: 'JWT auth, role-based access, and secure data handling by default.',
    icon: Lock,
    color: 'green',
  },
  {
    title: 'Lightning fast search',
    description: 'Vector similarity search with sub-second response times at scale.',
    icon: Zap,
    color: 'yellow',
  },
  {
    title: 'Semantic understanding',
    description: 'Find answers by meaning, not just keywords. Natural language queries.',
    icon: Search,
    color: 'indigo',
  },
  {
    title: 'Multi-model support',
    description: 'Choose from OpenAI, Anthropic, or Google models. Switch anytime.',
    icon: Globe,
    color: 'pink',
  },
  {
    title: 'Usage analytics',
    description: 'Track queries, costs, and performance with built-in dashboards.',
    icon: BarChart3,
    color: 'orange',
  },
  {
    title: 'Team collaboration',
    description: 'Share conversations, export knowledge, and collaborate in real-time.',
    icon: Users,
    color: 'teal',
  },
  {
    title: 'Developer-friendly API',
    description: 'RESTful API, webhooks, and SDKs for seamless integration.',
    icon: Code,
    color: 'red',
  },
]

const colorClasses = {
  blue: { light: 'bg-blue-50 text-blue-700', dark: 'bg-blue-500/10 text-blue-400' },
  purple: { light: 'bg-purple-50 text-purple-700', dark: 'bg-purple-500/10 text-purple-400' },
  green: { light: 'bg-green-50 text-green-700', dark: 'bg-green-500/10 text-green-400' },
  yellow: { light: 'bg-yellow-50 text-yellow-700', dark: 'bg-yellow-500/10 text-yellow-400' },
  indigo: { light: 'bg-indigo-50 text-indigo-700', dark: 'bg-indigo-500/10 text-indigo-400' },
  pink: { light: 'bg-pink-50 text-pink-700', dark: 'bg-pink-500/10 text-pink-400' },
  orange: { light: 'bg-orange-50 text-orange-700', dark: 'bg-orange-500/10 text-orange-400' },
  teal: { light: 'bg-teal-50 text-teal-700', dark: 'bg-teal-500/10 text-teal-400' },
  red: { light: 'bg-red-50 text-red-700', dark: 'bg-red-500/10 text-red-400' },
}

interface ExpandedFeaturesProps {
  isDark: boolean
}

export function ExpandedFeatures({ isDark }: ExpandedFeaturesProps) {
  const cardBase = isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'

  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything you need</h2>
          <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Powerful features to transform how your team works with documents.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const colors = colorClasses[feature.color as keyof typeof colorClasses]

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className={`${cardBase} h-full transition-all hover:shadow-lg`}>
                <CardHeader>
                  <div
                    className={`mb-3 inline-flex size-10 items-center justify-center rounded-lg ${
                      isDark ? colors.dark : colors.light
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>
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
