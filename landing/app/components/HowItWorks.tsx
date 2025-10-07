"use client"

import { motion } from 'framer-motion'
import { Upload, Zap, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { APP_URL } from '@/lib/config'

const steps = [
  {
    number: 1,
    title: 'Upload your documents',
    description: 'Drag and drop PDFs, DOCX, TXT, or Markdown files. We handle chunking, indexing, and vector embedding automatically.',
    icon: Upload,
    iconClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  {
    number: 2,
    title: 'AI processes & indexes',
    description: 'Our RAG pipeline chunks your content intelligently, generates embeddings, and stores them in optimized vector databases.',
    icon: Zap,
    iconClass: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  },
  {
    number: 3,
    title: 'Ask questions naturally',
    description: 'Type questions in plain English. Our context-aware AI retrieves relevant passages and generates accurate answers.',
    icon: MessageSquare,
    iconClass: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  },
  {
    number: 4,
    title: 'Get instant answers',
    description: 'Receive grounded responses with source citations. Export conversations, share knowledge, and iterate faster.',
    icon: CheckCircle2,
    iconClass: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  },
]

export function HowItWorks() {
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
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            From upload to insights in four simple steps. No ML expertise required.
          </p>
        </motion.div>
      </div>

      <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-16 hidden h-0.5 lg:block">
          <div className="h-full bg-gradient-to-r from-blue-200 via-purple-200 to-orange-200 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-orange-500/20" />
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <Card className="border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <CardContent className="p-6">
                  <div className="relative mb-4 flex items-center justify-center">
                    <div className={`flex size-16 items-center justify-center rounded-full ${step.iconClass}`}>
                      <Icon className="size-8" />
                    </div>
                    <div className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="mb-2 text-center font-semibold">{step.title}</h3>
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-10 text-center"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Ready to transform your document workflow?
        </p>
        <a href={APP_URL}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Start Free Trial →
          </motion.button>
        </a>
      </motion.div>
    </section>
  )
}
