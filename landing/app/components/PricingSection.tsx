"use client"

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { APP_URL } from '@/lib/config'

const plans = [
  {
    name: 'Starter',
    price: '$29',
    cadence: '/month',
    description: 'For small teams getting started with AI document search.',
    points: ['100 documents / month', '1,000 Q&A requests', '5 GB storage', 'Email support'],
    cta: 'Start free trial',
    featured: false,
    href: APP_URL,
  },
  {
    name: 'Growth',
    price: '$99',
    cadence: '/month',
    description: 'For teams that live inside documents every day.',
    points: [
      'Unlimited documents',
      '10,000 Q&A requests',
      '50 GB storage',
      'All LLM models (GPT-4, Claude, Gemini)',
      'Priority support (4 h response)',
      'Usage analytics dashboard',
    ],
    cta: 'Choose Growth',
    featured: true,
    href: APP_URL,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'Dedicated infrastructure, SLAs, and compliance support.',
    points: [
      'Unlimited scale',
      'Private VPC deployment',
      'SOC 2 / HIPAA / GDPR support',
      'Dedicated CSM & Slack channel',
      '99.99% uptime SLA',
    ],
    cta: 'Talk to sales',
    featured: false,
    href: '/contact',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 py-16 md:py-20 bg-slate-50/70 dark:bg-slate-950/40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Simple pricing that scales
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Start small, pay for what you use. No long-term contracts on Starter or Growth.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <Card
                className={`flex h-full flex-col border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${
                  plan.featured ? 'border-blue-400 shadow-lg shadow-blue-200/20 dark:shadow-blue-900/20' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.featured && <Badge>Most popular</Badge>}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </CardDescription>
                  <div className="pt-1">
                    <span className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{plan.price}</span>
                    {plan.cadence && (
                      <span className="ml-1 text-sm text-slate-600 dark:text-slate-400">{plan.cadence}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-blue-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <a href={plan.href} className="block">
                    <Button variant={plan.featured ? 'default' : 'secondary'} className="w-full">
                      {plan.cta}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          All plans include a 14-day free trial. No credit card required to start.
        </motion.p>
      </div>
    </section>
  )
}
