"use client"

import { useLandingTheme } from '../lib/useLandingTheme'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { EnhancedFAQ } from '../components/EnhancedFAQ'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function FAQPage() {
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
        <div className="mx-auto max-w-4xl px-6">
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
              Frequently asked questions
            </h1>
            <p className={`mt-6 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Everything you need to know about DocuLume. Can't find what you're looking for? Contact our team.
            </p>
          </motion.div>
        </div>
      </section>

      <EnhancedFAQ isDark={isDark} />

      <SiteFooter isDark={isDark} />
    </main>
  )
}
