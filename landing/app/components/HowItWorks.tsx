"use client"

import { motion } from 'framer-motion'
import { Upload, Zap, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from './ui/card'

const steps = [
  {
    number: 1,
    title: 'Upload your documents',
    description: 'Drag and drop PDFs, DOCX, TXT, or Markdown files. We handle chunking, indexing, and vector embedding automatically.',
    icon: Upload,
    color: 'blue',
  },
  {
    number: 2,
    title: 'AI processes & indexes',
    description: 'Our RAG pipeline chunks your content intelligently, generates embeddings, and stores them in optimized vector databases.',
    icon: Zap,
    color: 'purple',
  },
  {
    number: 3,
    title: 'Ask questions naturally',
    description: 'Type questions in plain English. Our context-aware AI retrieves relevant passages and generates accurate answers.',
    icon: MessageSquare,
    color: 'green',
  },
  {
    number: 4,
    title: 'Get instant answers',
    description: 'Receive grounded responses with source citations. Export conversations, share knowledge, and iterate faster.',
    icon: CheckCircle2,
    color: 'orange',
  },
]

const colorClasses = {
  blue: {
    light: 'bg-blue-50 text-blue-700',
    dark: 'bg-blue-500/10 text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  purple: {
    light: 'bg-purple-50 text-purple-700',
    dark: 'bg-purple-500/10 text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  green: {
    light: 'bg-green-50 text-green-700',
    dark: 'bg-green-500/10 text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  orange: {
    light: 'bg-orange-50 text-orange-700',
    dark: 'bg-orange-500/10 text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
}

interface HowItWorksProps {
  isDark: boolean
}

export function HowItWorks({ isDark }: HowItWorksProps) {
  const cardBase = isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
          <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            From upload to insights in four simple steps. No ML expertise required.
          </p>
        </motion.div>
      </div>

      <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Connecting line (desktop only) */}
        <div className="absolute left-0 right-0 top-16 hidden h-0.5 lg:block">
          <div className={`h-full ${isDark ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-orange-500/20' : 'bg-gradient-to-r from-blue-200 via-purple-200 to-orange-200'}`} />
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon
          const colors = colorClasses[step.color as keyof typeof colorClasses]

          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <Card className={cardBase}>
                <CardContent className="p-6">
                  {/* Step number badge */}
                  <div className="relative mb-4 flex items-center justify-center">
                    <div className={`flex size-16 items-center justify-center rounded-full ${
                      isDark ? colors.dark : colors.light
                    }`}>
                      <Icon className="size-8" />
                    </div>
                    <div className={`absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                      isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {step.number}
                    </div>
                  </div>

                  <h3 className="mb-2 text-center font-semibold">{step.title}</h3>
                  <p className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-10 text-center"
      >
        <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Ready to transform your document workflow?
        </p>
        <a href={process.env.NEXT_PUBLIC_FE_URL || '#'}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`rounded-lg px-6 py-3 font-semibold ${
              isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Start Free Trial →
          </motion.button>
        </a>
      </motion.div>
    </section>
  )
}
