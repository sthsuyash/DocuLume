"use client"

import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import { Card, CardContent } from './ui/card'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'VP of Operations',
    company: 'TechFlow Inc',
    avatar: 'SC',
    quote: 'DocuLume cut our internal documentation search time from 15 minutes to under 30 seconds. Our support team can now handle 3x more tickets per day.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Legal Director',
    company: 'GlobalLaw Partners',
    avatar: 'MR',
    quote: "We process thousands of contracts monthly. DocuLume's AI helps our paralegals find relevant clauses instantly. ROI was evident within the first month.",
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Product Manager',
    company: 'StartupHub',
    avatar: 'EW',
    quote: 'The RAG implementation is phenomenal. Our product docs are now actually useful. Customer success teams love how fast they can find answers.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'CTO',
    company: 'FinanceAI',
    avatar: 'DK',
    quote: 'Enterprise-grade security with startup-level ease of use. We were up and running in under an hour. The context-aware answers are incredibly accurate.',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Head of Customer Support',
    company: 'CloudScale',
    avatar: 'LT',
    quote: 'Game changer for our knowledge base. New support reps can find answers as fast as our 5-year veterans. Training time reduced by 60%.',
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'Engineering Lead',
    company: 'DevTools Co',
    avatar: 'JP',
    quote: 'The API is clean, the docs are excellent, and the performance is outstanding. We integrated it into our workflow in a single sprint.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 md:py-16">
      <div className="mb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Trusted by high-velocity teams</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            See how leading companies use DocuLume to transform their document workflows.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="h-full border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <CardContent className="p-6">
                <Quote className="mb-4 size-8 text-blue-600 dark:text-blue-400" />
                <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  "{testimonial.quote}"
                </p>
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
