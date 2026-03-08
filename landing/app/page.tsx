"use client"

import { FormEvent, useState } from 'react'
import { ArrowRight, Check, FileText, Lock, Mail, ShieldCheck, Sparkles, Zap } from 'lucide-react'

import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { useLandingTheme } from './lib/useLandingTheme'
import { ExpandedFeatures } from './components/ExpandedFeatures'
import { HowItWorks } from './components/HowItWorks'
import { UseCases } from './components/UseCases'
import { Stats } from './components/Stats'
import { Comparison } from './components/Comparison'
import { Testimonials } from './components/Testimonials'
import { VideoDemo } from './components/VideoDemo'
import { TrustBadges } from './components/TrustBadges'
import { EnhancedFAQ } from './components/EnhancedFAQ'
import { FloatingCTA } from './components/FloatingCTA'

const features = [
  {
    title: 'Fast document ingestion',
    description: 'Upload PDFs, DOCX, Markdown, and TXT with automatic chunking and indexing.',
    icon: FileText,
  },
  {
    title: 'Context-aware answers',
    description: 'Grounded responses powered by production-ready RAG pipelines.',
    icon: Sparkles,
  },
  {
    title: 'Enterprise security',
    description: 'JWT auth, role-based access, and secure data handling by default.',
    icon: Lock,
  },
]

const plans = [
  {
    name: 'Starter',
    price: '$29',
    cadence: '/month',
    points: ['100 docs/month', '1,000 Q&A requests', '5 GB storage'],
    cta: 'Start free trial',
    featured: false,
  },
  {
    name: 'Growth',
    price: '$99',
    cadence: '/month',
    points: ['Unlimited docs', '10,000 Q&A requests', '50 GB storage', 'Priority support'],
    cta: 'Choose Growth',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    points: ['Unlimited scale', 'Private deployment', 'SLA & compliance support'],
    cta: 'Talk to sales',
    featured: false,
  },
]

const faqs = [
  {
    question: 'How fast can we go live?',
    answer: 'Most teams upload their first knowledge base and start querying in under 10 minutes.',
  },
  {
    question: 'Does it support private deployments?',
    answer: 'Yes. Enterprise plans include dedicated infrastructure and private networking options.',
  },
  {
    question: 'Can we control model usage?',
    answer: 'You can configure model access and usage limits per workspace to stay compliant and predictable.',
  },
]

export default function Home() {
  const { mobileOpen, setMobileOpen, isDark, setIsDark, appUrl } = useLandingTheme()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null)
  const [newsletterError, setNewsletterError] = useState<string | null>(null)

  const mainTheme = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
  const sectionTextMuted = isDark ? 'text-slate-400' : 'text-slate-600'
  const heroBg = isDark ? 'bg-linear-to-b from-slate-900 via-slate-950 to-slate-950' : 'bg-linear-to-b from-blue-50 via-white to-white'
  const cardBase = isDark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setNewsletterMessage(null)
    setNewsletterError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        setNewsletterError(payload.message ?? 'Subscription failed. Please try again.')
        return
      }

      setNewsletterMessage(payload.message ?? 'Subscribed successfully.')
      setEmail('')
    } catch {
      setNewsletterError('Unable to reach subscription service. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={`min-h-screen transition-colors ${mainTheme}`}>
      <SiteHeader
        isDark={isDark}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        appUrl={appUrl}
      />

      <section id="home" className="relative overflow-hidden scroll-mt-20 fade-up">
        <div className={`absolute inset-0 ${heroBg}`} />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-28 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-5" variant="secondary">
              AI knowledge platform for document-heavy teams
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Turn every document into instant, trustworthy answers.
            </h1>
            <p className={`mx-auto mt-5 max-w-2xl text-pretty text-base md:text-lg ${sectionTextMuted}`}>
              DocuLume helps support, operations, legal, and product teams find answers from manuals, contracts, and
              internal docs in seconds.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={appUrl}>
                <Button size="lg" className="w-full sm:w-auto">
                  Start free trial
                  <ArrowRight className="size-4" />
                </Button>
              </a>
              <a href="#newsletter">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Join newsletter
                </Button>
              </a>
            </div>
            <div className={`mt-10 flex items-center justify-center gap-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="inline-flex items-center gap-2">
                <Zap className="size-4 text-blue-500" />
                2-minute onboarding
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-blue-500" />
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 md:py-16 fade-up">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className={cardBase}>
            <CardHeader>
              <CardTitle>Why teams choose DocuLume</CardTitle>
              <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Replace slow internal search with a fast AI copilot trained on your own documentation.
              </CardDescription>
            </CardHeader>
            <CardContent className={`grid grid-cols-2 gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <div>
                <p className="text-2xl font-semibold">10x</p>
                <p>faster document lookup</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">99.9%</p>
                <p>platform uptime target</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">50+</p>
                <p>file types and variants</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">24/7</p>
                <p>availability for your team</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardHeader>
              <CardTitle>Built for market-ready teams</CardTitle>
              <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Designed for demos, self-serve onboarding, and clear conversion paths from visitor to trial.
              </CardDescription>
            </CardHeader>
            <CardContent className={`space-y-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <p className="inline-flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-blue-500" />
                Conversion-focused hero with clear primary CTA
              </p>
              <p className="inline-flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-blue-500" />
                Feature and pricing structure for quick qualification
              </p>
              <p className="inline-flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-blue-500" />
                Newsletter capture to keep leads warm
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats & Social Proof */}
      <Stats isDark={isDark} />

      {/* Features Overview with CTA */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-8 md:py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Product features</h2>
          <p className={`mt-3 ${sectionTextMuted}`}>Everything needed to search, reason, and answer from your docs.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className={`${cardBase} ${isDark ? '' : 'backdrop-blur-sm'}`}>
                <CardHeader>
                  <div className={`mb-3 inline-flex size-10 items-center justify-center rounded-lg ${
                    isDark ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
        <div className="mt-8 text-center">
          <a href="/features" className={`inline-flex items-center gap-2 font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            View all features <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className={`py-12 ${isDark ? 'bg-slate-950/30' : 'bg-slate-50/70'}`}>
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
          <p className={`mt-3 mb-8 ${sectionTextMuted}`}>From upload to insights in four simple steps</p>
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="text-2xl mb-2">📤</div>
              <h3 className="font-semibold mb-1">Upload</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Drop your documents</p>
            </div>
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">Process</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>AI indexes content</p>
            </div>
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold mb-1">Ask</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Natural language queries</p>
            </div>
            <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-semibold mb-1">Answer</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Instant, cited responses</p>
            </div>
          </div>
          <a href="/demo" className={`inline-flex items-center gap-2 font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            Watch full demo <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* Use Cases Preview */}
      <section className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Built for every team</h2>
          <p className={`mt-3 ${sectionTextMuted}`}>Solutions across industries</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[
            { icon: '🎧', title: 'Customer Support', stat: '70% faster' },
            { icon: '⚖️', title: 'Legal & Compliance', stat: '10x research speed' },
            { icon: '💻', title: 'Engineering Teams', stat: '5hrs saved/week' },
          ].map((useCase) => (
            <Card key={useCase.title} className={cardBase}>
              <CardHeader>
                <div className="text-3xl mb-2">{useCase.icon}</div>
                <CardTitle className="text-lg">{useCase.title}</CardTitle>
                <CardDescription className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>
                  {useCase.stat}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <a href="/solutions" className={`inline-flex items-center gap-2 font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            Explore all solutions <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className={`py-12 ${isDark ? 'bg-slate-900/30' : 'bg-slate-50'}`}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Trusted by teams worldwide</h2>
            <p className={`mt-3 ${sectionTextMuted}`}>See what our customers say</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card className={cardBase}>
              <CardContent className="p-6">
                <p className={`mb-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  "DocuLume cut our search time from 15 minutes to 30 seconds. Game changer for our support team."
                </p>
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-full font-semibold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                    SC
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sarah Chen</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>VP Operations, TechFlow</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cardBase}>
              <CardContent className="p-6">
                <p className={`mb-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  "ROI was evident within the first month. Our paralegals find contract clauses instantly."
                </p>
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-full font-semibold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                    MR
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Michael Rodriguez</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Legal Director, GlobalLaw</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <a href="/customers" className={`inline-flex items-center gap-2 font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
              Read all testimonials <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Trust & Security Preview */}
      <TrustBadges isDark={isDark} />
      <div className="text-center pb-8">
        <a href="/security" className={`inline-flex items-center gap-2 font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
          Learn about our security <ArrowRight className="size-4" />
        </a>
      </div>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 md:py-16 fade-up">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Simple pricing that scales</h2>
          <p className={`mt-3 ${sectionTextMuted}`}>Start small, then scale as your document operations grow.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`${cardBase} ${plan.featured ? 'border-blue-400 shadow-lg shadow-blue-200/20' : ''}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.featured && <Badge>Most popular</Badge>}
                </CardTitle>
                <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  <span className={`text-3xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className="ml-1">{plan.cadence}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className={`mb-6 space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {plan.points.map((point) => (
                    <li key={point} className="inline-flex items-center gap-2">
                      <Check className="size-4 text-blue-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.featured ? 'default' : 'secondary'} className="w-full">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Preview */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-8 md:py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Frequently asked questions</h2>
          <p className={`mt-3 ${sectionTextMuted}`}>Common questions from teams evaluating DocuLume.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {faqs.map((faq) => (
            <Card key={faq.question} className={cardBase}>
              <CardHeader>
                <CardTitle className="text-base">{faq.question}</CardTitle>
                <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>{faq.answer}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <a href="/faq" className={`inline-flex items-center gap-2 font-semibold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
            View all FAQs <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <section id="newsletter" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12 md:py-16 fade-up">
        <div
          className={`relative overflow-hidden rounded-3xl border p-6 md:p-10 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
          }`}
        >
          <div
            className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl ${
              isDark ? 'bg-blue-500/20' : 'bg-blue-200/60'
            }`}
          />
          <div
            className={`pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full blur-3xl ${
              isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/50'
            }`}
          />

          <div className="relative grid gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <Badge variant="secondary" className="mb-4">
                Newsletter
              </Badge>
              <h3 className="text-balance text-2xl font-semibold tracking-tight md:text-4xl">
                Get growth tactics, product drops, and AI playbooks every week.
              </h3>
              <p className={`mt-3 max-w-2xl text-sm md:text-base ${sectionTextMuted}`}>
                One practical email per week for founders and teams building with AI documents. No spam, unsubscribe
                anytime.
              </p>
              <div className={`mt-5 flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-500" />
                  Privacy-first
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4 text-blue-500" />
                  Actionable weekly tips
                </span>
              </div>
            </div>

            <div className="md:col-span-5">
              <Card className={isDark ? 'border-slate-700 bg-slate-950/80' : 'border-slate-200 bg-white/90'}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Subscribe now</CardTitle>
                  <CardDescription className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Join high-intent teams using DocuLume.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="flex flex-col gap-3" onSubmit={handleNewsletterSubmit}>
                    <div className="relative">
                      <Mail className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      <Input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isSubmitting}
                        className={`pl-10 ${isDark ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500' : ''}`}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Subscribing...' : 'Get weekly insights'}
                    </Button>
                  </form>

                  {newsletterMessage && <p className="mt-3 text-sm text-emerald-500">{newsletterMessage}</p>}
                  {newsletterError && <p className="mt-3 text-sm text-red-500">{newsletterError}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter isDark={isDark} />

      {/* Floating CTA Button */}
      <FloatingCTA isDark={isDark} appUrl={appUrl} />
    </main>
  )
}
