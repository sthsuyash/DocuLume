"use client"

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { APP_URL } from '@/lib/config'

const features = [
  { feature: 'Natural language search',     traditional: false,       doculume: true },
  { feature: 'Context-aware answers',       traditional: false,       doculume: true },
  { feature: 'Source citations',            traditional: false,       doculume: true },
  { feature: 'Multi-document synthesis',    traditional: false,       doculume: true },
  { feature: 'Conversational follow-ups',   traditional: false,       doculume: true },
  { feature: 'Instant semantic search',     traditional: false,       doculume: true },
  { feature: 'Setup time',                  traditional: 'Days-Weeks', doculume: '< 10 min' },
  { feature: 'Accuracy',                    traditional: '60-70%',    doculume: '95%+' },
  { feature: 'Cost per query',              traditional: '$0',        doculume: '~ $0.01' },
]

export function Comparison() {
  return (
    <section className="scroll-mt-24 py-16 md:py-20 bg-slate-50/70 dark:bg-slate-950/30">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Why AI search beats keyword matching
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              See how DocuLume compares to traditional document search solutions.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50">
                <th className="p-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Feature</th>
                <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">Traditional Search</th>
                <th className="p-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">DocuLume AI</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <motion.tr
                  key={item.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100 dark:border-slate-800/50"
                >
                  <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{item.feature}</td>
                  <td className="p-4 text-center">
                    {typeof item.traditional === 'boolean' ? (
                      item.traditional
                        ? <Check className="mx-auto size-5 text-green-500" />
                        : <X className="mx-auto size-5 text-red-500" />
                    ) : (
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.traditional}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {typeof item.doculume === 'boolean' ? (
                      item.doculume
                        ? <Check className="mx-auto size-5 text-green-500" />
                        : <X className="mx-auto size-5 text-red-500" />
                    ) : (
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{item.doculume}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <a href={APP_URL}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              Experience the difference →
            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
