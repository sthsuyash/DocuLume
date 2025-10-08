"use client"

import { useTheme } from './lib/useTheme'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { HeroSection } from './components/HeroSection'
import { Stats } from './components/Stats'
import { HowItWorks } from './components/HowItWorks'
import { ExpandedFeatures } from './components/ExpandedFeatures'
import { Comparison } from './components/Comparison'
import { UseCases } from './components/UseCases'
import { Testimonials } from './components/Testimonials'
import { TrustBadges } from './components/TrustBadges'
import { PricingSection } from './components/PricingSection'
import { EnhancedFAQ } from './components/EnhancedFAQ'
import { NewsletterSection } from './components/NewsletterSection'
import { FloatingCTA } from './components/FloatingCTA'

export default function Home() {
  const { isDark, toggle } = useTheme()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <SiteHeader isDark={isDark} onToggleTheme={toggle} />
      <HeroSection />
      <Stats />
      <HowItWorks />
      <ExpandedFeatures />
      <Comparison />
      <UseCases />
      <Testimonials />
      <TrustBadges />
      <PricingSection />
      <EnhancedFAQ />
      <NewsletterSection />
      <SiteFooter />
      <FloatingCTA />
    </main>
  )
}
