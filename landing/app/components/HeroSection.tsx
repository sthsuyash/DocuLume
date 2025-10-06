"use client"

import { motion } from 'framer-motion'
import { ArrowRight, Check, FileText, Sparkles, Send } from 'lucide-react'
import { Button } from './ui/button'
import { APP_URL } from '@/lib/config'

function ProductMockup() {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute -inset-8 rounded-3xl bg-blue-500/10 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl ring-1 ring-white/5">
        <div className="flex items-center gap-2 border-b border-slate-700/60 bg-slate-800/90 px-4 py-3">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-yellow-500/70" />
          <span className="size-3 rounded-full bg-green-500/70" />
          <span className="ml-3 flex-1 rounded bg-slate-700/50 px-3 py-1 text-center text-xs text-slate-400">
            DocuLume Chat
          </span>
        </div>

        <div className="flex gap-2 border-b border-slate-700/30 bg-slate-800/40 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/70 px-2.5 py-1 text-xs text-slate-300">
            <FileText className="size-3 text-blue-400" />
            employee-handbook.pdf
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/70 px-2.5 py-1 text-xs text-slate-300">
            <FileText className="size-3 text-blue-400" />
            enterprise-agreement.docx
          </span>
        </div>

        <div className="space-y-4 p-4">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="flex justify-end"
          >
            <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white">
              What&apos;s the refund window for enterprise annual contracts?
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.75 }}
            className="flex gap-2.5"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 mt-0.5">
              <Sparkles className="size-3.5 text-blue-400" />
            </div>
            <div className="space-y-2">
              <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3 text-sm leading-relaxed text-slate-200">
                Enterprise annual contracts include a{' '}
                <mark className="rounded bg-blue-500/25 px-0.5 text-blue-300 [background:none] [background-color:rgba(59,130,246,0.2)]">
                  30-day refund window
                </mark>{' '}
                from the contract start date. After this period, prorated credits apply for unused prepaid months.
              </div>
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 1.2 }}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300"
              >
                <FileText className="size-3" />
                enterprise-agreement.docx · §4.2 · p.&thinsp;8
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: 1.5 }}
            className="flex gap-2.5 items-center"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800">
              <div className="size-1.5 rounded-full bg-slate-600" />
            </div>
            <span className="cursor-blink inline-block h-4 w-0.5 bg-blue-400 rounded" />
          </motion.div>
        </div>

        <div className="border-t border-slate-700/30 bg-slate-800/40 px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-600/40 bg-slate-800 px-3 py-2.5">
            <span className="flex-1 text-xs text-slate-500">Ask anything about your documents…</span>
            <Send className="size-3.5 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative scroll-mt-20 overflow-hidden bg-white dark:bg-slate-950"
    >
      <div
        className="pointer-events-none absolute inset-0 hero-grid-light dark:hero-grid-dark"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
              <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
              Now in early access
            </div>

            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              Ask your documents{' '}
              <span className="text-blue-600 dark:text-blue-400">anything.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              DocuLume gives your team instant, cited answers from manuals, contracts, and wikis — in plain English.
              No more hunting through tabs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={APP_URL}>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Start free — no card needed
                  <ArrowRight className="size-4" />
                </Button>
              </a>
              <a href="/demo">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Watch a demo
                </Button>
              </a>
            </div>

            <div className="mt-7 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:gap-5">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-blue-500" />
                Up and running in 10 minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-blue-500" />
                Answers cite exact sources
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-blue-500" />
                Cancel anytime
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <ProductMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
