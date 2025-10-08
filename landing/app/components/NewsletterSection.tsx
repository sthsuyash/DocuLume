"use client"

import { FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ShieldCheck, Check } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setError(payload.message ?? 'Subscription failed. Please try again.')
        return
      }
      setMessage(payload.message ?? 'Subscribed successfully.')
      setEmail('')
    } catch {
      setError('Unable to reach subscription service. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="newsletter" className="scroll-mt-24 py-16 md:py-20 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/80 md:p-12"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-500/15" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" aria-hidden />

          <div className="relative grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <Badge variant="secondary" className="mb-4">Newsletter</Badge>
              <h3 className="text-balance text-2xl font-semibold tracking-tight md:text-4xl">
                AI playbooks, product drops, and real-world RAG case studies. Weekly.
              </h3>
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-400 md:text-base">
                One practical email per week for founders and teams building with documents. No fluff, unsubscribe anytime.
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-500" />
                  No spam, ever
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4 text-blue-500" />
                  Actionable weekly tips
                </span>
              </div>
            </div>

            <div className="md:col-span-5">
              <Card className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/80">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Get weekly insights</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Join teams using DocuLume to move faster.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <Input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="pl-10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Subscribing…' : 'Subscribe'}
                    </Button>
                  </form>
                  {message && <p className="mt-3 text-sm text-emerald-500">{message}</p>}
                  {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
