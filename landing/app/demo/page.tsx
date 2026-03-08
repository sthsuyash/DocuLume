"use client"

import { useLandingTheme } from '../lib/useLandingTheme'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { VideoDemo } from '../components/VideoDemo'
import { HowItWorks } from '../components/HowItWorks'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function DemoPage() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()

  return (
    <main className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      <section className="relative overflow-hidden py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/" className={`mb-6 inline-flex items-center gap-2 text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
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
            <p className={`mt-6 max-w-2xl text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Watch how teams upload documents, ask questions, and get instant AI-powered answers in under 2 minutes.
            </p>
          </motion.div>
        </div>
      </section>

      <VideoDemo isDark={isDark} />
      <HowItWorks isDark={isDark} />

      <SiteFooter isDark={isDark} />
    </main>
  )
}
