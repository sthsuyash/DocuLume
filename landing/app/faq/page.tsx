"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { EnhancedFAQ } from '@/components/EnhancedFAQ'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function FAQPage() {
  const { isDark, toggle } = useTheme()

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Frequently asked questions
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">
              {"Everything you need to know about DocuLume. Can't find what you're looking for? Contact our team."}
            </p>
          </motion.div>
        </div>
      </section>

      <EnhancedFAQ />

      <SiteFooter />
    </main>
  )
}
