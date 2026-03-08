"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface FloatingCTAProps {
  isDark: boolean
  appUrl: string
}

export function FloatingCTA({ isDark, appUrl }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px down
      if (window.scrollY > 800 && !isDismissed) {
        setIsVisible(true)
      } else if (window.scrollY <= 800) {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className={`relative rounded-2xl border shadow-2xl ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className={`absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full ${
                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <X className="size-3" />
            </button>

            <div className="p-4">
              <div className="mb-3">
                <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  Ready to get started?
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Start your free trial today
                </p>
              </div>

              <a href={appUrl}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
                >
                  Try DocuLume Free
                  <ArrowRight className="size-4" />
                </motion.button>
              </a>

              <p className={`mt-2 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                No credit card required
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
