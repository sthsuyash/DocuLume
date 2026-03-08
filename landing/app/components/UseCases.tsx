"use client"

import { motion } from 'framer-motion'
import { Building2, Scale, Headphones, Code, FileText, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const useCases = [
  {
    title: 'Customer Support',
    icon: Headphones,
    description: 'Empower support teams to find answers from help docs, SOPs, and product manuals instantly.',
    benefits: ['Reduce ticket resolution time by 70%', 'Onboard new agents 3x faster', 'Maintain answer consistency'],
    stats: '70% faster resolution',
  },
  {
    title: 'Legal & Compliance',
    icon: Scale,
    description: 'Search contracts, regulatory documents, and case law with precision. Get clause-level citations.',
    benefits: ['Find relevant clauses in seconds', 'Ensure regulatory compliance', 'Reduce manual review time'],
    stats: '10x faster research',
  },
  {
    title: 'Engineering Teams',
    icon: Code,
    description: 'Navigate technical docs, API references, and architecture diagrams. Build smarter, not harder.',
    benefits: ['Instant access to internal wikis', 'Find code examples quickly', 'Reduce context-switching'],
    stats: '5hrs saved per week',
  },
  {
    title: 'Sales & Presales',
    icon: Building2,
    description: 'Access product specs, pricing sheets, and competitive intel. Close deals with confidence.',
    benefits: ['Answer RFPs 5x faster', 'Never miss product details', 'Consistent messaging'],
    stats: '40% faster proposals',
  },
  {
    title: 'Knowledge Management',
    icon: FileText,
    description: 'Centralize company knowledge. Make SOPs, policies, and best practices instantly searchable.',
    benefits: ['Single source of truth', 'Automatic updates', 'Cross-team collaboration'],
    stats: '100% knowledge coverage',
  },
  {
    title: 'HR & Operations',
    icon: Users,
    description: 'Employee handbooks, training materials, and process docs at your fingertips.',
    benefits: ['Streamline onboarding', 'Answer policy questions 24/7', 'Reduce HR workload'],
    stats: '60% less HR tickets',
  },
]

interface UseCasesProps {
  isDark: boolean
}

export function UseCases({ isDark }: UseCasesProps) {
  const cardBase = isDark ? 'border-slate-800 bg-slate-900/50 text-slate-100' : 'border-slate-200 bg-white text-slate-900'

  return (
    <section id="use-cases" className={`scroll-mt-24 py-16 md:py-20 ${isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for every team</h2>
            <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              From support to legal to engineering - DocuLume adapts to your workflow.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon

            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className={`${cardBase} h-full transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg`}>
                  <CardHeader>
                    <div className={`mb-3 inline-flex size-12 items-center justify-center rounded-xl ${
                      isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                    }`}>
                      <Icon className="size-6" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {useCase.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {useCase.description}
                    </p>

                    <ul className={`mb-4 space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {useCase.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <div className={`rounded-lg px-3 py-2 text-center text-sm font-semibold ${
                      isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {useCase.stats}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
