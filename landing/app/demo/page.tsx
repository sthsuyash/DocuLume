"use client"

import { useTheme } from '@/lib/useTheme'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { VideoDemo } from '@/components/VideoDemo'
import { HowItWorks } from '@/components/HowItWorks'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function DemoPage() {
  const { isDark, toggle } = useTheme()

  return (
    <main className="min-h-screen transition-colors bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />

      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-6">
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
              See DocuLume in action
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Watch how teams upload documents, ask questions, and get instant AI-powered answers in under 2 minutes.
            </p>
          </motion.div>
        </div>
      </section>

      <VideoDemo />
      <HowItWorks />

      <SiteFooter />
    </main>
  )
}
