"use client"

import { motion } from 'framer-motion'
import { Shield, Lock, CheckCircle2, Globe } from 'lucide-react'

const trustItems = [
  { icon: Shield,       title: 'SOC 2 Type II', description: 'Certified'  },
  { icon: Lock,         title: 'GDPR',          description: 'Compliant'  },
  { icon: CheckCircle2, title: 'HIPAA',         description: 'Ready'      },
  { icon: Globe,        title: 'ISO 27001',     description: 'Certified'  },
]

export function TrustBadges() {
  return (
    <section className="py-12 bg-white dark:bg-slate-900/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Enterprise-grade security & compliance
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your data is protected with industry-leading security standards
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {trustItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                  <Icon className="size-6" />
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{item.description}</div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold">256-bit encryption</span> •{' '}
            <span className="font-semibold">Regular security audits</span> •{' '}
            <span className="font-semibold">Zero-knowledge architecture</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
