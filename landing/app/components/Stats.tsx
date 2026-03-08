"use client"

import { motion } from 'framer-motion'
import { TrendingUp, Users, Clock, Shield } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '10,000+',
    label: 'Active users',
    description: 'Teams using DocuLume daily',
  },
  {
    icon: TrendingUp,
    value: '5M+',
    label: 'Documents processed',
    description: 'Knowledge base entries indexed',
  },
  {
    icon: Clock,
    value: '98.5%',
    label: 'Time saved',
    description: 'Reduction in document search time',
  },
  {
    icon: Shield,
    value: '99.99%',
    label: 'Uptime SLA',
    description: 'Enterprise reliability guarantee',
  },
]

const logos = [
  { name: 'TechCorp', width: 120 },
  { name: 'InnovateAI', width: 140 },
  { name: 'CloudScale', width: 130 },
  { name: 'DataFlow', width: 110 },
  { name: 'SecureOps', width: 125 },
  { name: 'FastGrowth', width: 135 },
]

interface StatsProps {
  isDark: boolean
}

export function Stats({ isDark }: StatsProps) {
  return (
    <section className={`scroll-mt-24 py-16 md:py-20 ${isDark ? 'bg-slate-900/50' : 'bg-white'}`}>
      <div className="mx-auto max-w-6xl px-6">
        {/* Company Logos */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className={`mb-8 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Trusted by leading companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {logos.map((logo, index) => (
                <motion.div
                  key={logo.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center justify-center rounded-lg px-6 py-3 ${
                    isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-600'
                  }`}
                  style={{ width: `${logo.width}px` }}
                >
                  <span className="font-semibold text-sm">{logo.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-xl border p-6 text-center ${
                  isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
                  isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon className="size-7" />
                </div>
                <div className={`mb-1 text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {stat.value}
                </div>
                <div className={`mb-2 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {stat.label}
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {stat.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
