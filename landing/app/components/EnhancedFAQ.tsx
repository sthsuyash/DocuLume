"use client"

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'How fast can we go live?',
    answer: 'Most teams upload their first knowledge base and start querying in under 10 minutes. Our onboarding is designed for speed - no ML expertise required.',
  },
  {
    question: 'Does it support private deployments?',
    answer: 'Yes. Enterprise plans include dedicated infrastructure, private VPCs, and custom networking options. We support AWS, GCP, and Azure deployments.',
  },
  {
    question: 'Which file formats are supported?',
    answer: 'We support PDF, DOCX, TXT, Markdown, CSV, and more. Files are automatically chunked and indexed. Custom parsers available for Enterprise.',
  },
  {
    question: 'How accurate are the answers?',
    answer: 'Our RAG pipeline delivers 95%+ accuracy by grounding responses in your actual documents. Every answer includes source citations for verification.',
  },
  {
    question: 'Can we control model usage and costs?',
    answer: 'Yes. Configure model access, set usage limits per workspace, and get detailed cost breakdowns. We support OpenAI, Anthropic, and Google models.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Enterprise-grade security is built-in: JWT auth, role-based access, encrypted storage, SOC 2 Type II compliance, and optional HIPAA/GDPR support.',
  },
  {
    question: 'What about API access?',
    answer: 'Full REST API included. Integrate DocuLume into your existing workflows, Slack, or custom tools. Comprehensive docs and SDKs provided.',
  },
  {
    question: 'How does pricing work?',
    answer: 'Simple usage-based pricing. Start with 100 docs/month free. Scale to unlimited documents with Growth plans. Enterprise includes custom SLAs.',
  },
  {
    question: 'Can we migrate from existing solutions?',
    answer: 'Yes. We provide migration tools and dedicated support to move from Confluence, SharePoint, Google Drive, or custom solutions.',
  },
  {
    question: 'What kind of support do you offer?',
    answer: 'Starter: Email support (24h response). Growth: Priority support (4h response). Enterprise: Dedicated slack channel, CSM, and 99.99% SLA.',
  },
]

interface EnhancedFAQProps {
  isDark: boolean
}

export function EnhancedFAQ({ isDark }: EnhancedFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Frequently asked questions</h2>
          <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Everything you need to know about DocuLume. Still have questions? Contact our team.
          </p>
        </motion.div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  isDark
                    ? 'border-slate-800 bg-slate-900 hover:bg-slate-800/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                } ${isOpen ? (isDark ? 'border-blue-700' : 'border-blue-300') : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`size-5 shrink-0 transition-transform ${isDark ? 'text-slate-400' : 'text-slate-600'} ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {faq.answer}
                  </p>
                </motion.div>
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 text-center"
      >
        <p className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Still have questions?
        </p>
        <a
          href="/contact"
          className={`inline-block rounded-lg px-6 py-3 font-semibold transition-colors ${
            isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
          }`}
        >
          Contact our team →
        </a>
      </motion.div>
    </section>
  )
}
