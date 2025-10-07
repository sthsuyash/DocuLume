"use client"

import { motion } from 'framer-motion'

const logos = ['TechFlow', 'GlobalLaw', 'CloudScale', 'DataFlow', 'SecureOps', 'FinanceAI']

const stats = [
  { value: '10,000+', label: 'Active users',           note: 'Teams querying daily' },
  { value: '5M+',     label: 'Documents processed',    note: 'Knowledge bases indexed' },
  { value: '95%+',    label: 'Answer accuracy',        note: 'Grounded in source docs' },
  { value: '99.9%',   label: 'Uptime SLA',             note: 'Enterprise reliability' },
]

export function Stats() {
  return (
    <section className="scroll-mt-24 py-14 md:py-18 bg-slate-50 dark:bg-slate-900/60">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {logos.map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="text-sm font-bold tracking-wider uppercase text-slate-300 dark:text-slate-600"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{stat.note}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
