"use client"

import { motion } from 'framer-motion'
import { Play, Monitor } from 'lucide-react'
import { useState } from 'react'

interface VideoDemoProps {
  isDark: boolean
}

export function VideoDemo({ isDark }: VideoDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className={`scroll-mt-24 py-16 md:py-20 ${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">See DocuLume in action</h2>
            <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Watch how teams transform their document workflows in minutes
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-4xl"
        >
          <div className={`group relative overflow-hidden rounded-2xl border shadow-2xl ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            {/* Video thumbnail/placeholder */}
            <div className="relative aspect-video bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
              {!isPlaying ? (
                <>
                  {/* Placeholder content */}
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsPlaying(true)}
                        className={`mx-auto mb-4 flex size-20 cursor-pointer items-center justify-center rounded-full ${
                          isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        } shadow-xl transition-all hover:shadow-2xl`}
                      >
                        <Play className="ml-1 size-10" fill="currentColor" />
                      </motion.div>
                      <p className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Watch 2-minute demo
                      </p>
                      <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        See how to upload, query, and get answers
                      </p>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className={`absolute left-8 top-8 flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                      isDark ? 'border-slate-700 bg-slate-900/90' : 'border-slate-200 bg-white/90'
                    }`}>
                      <Monitor className={`size-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Product Demo
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  {/* Placeholder for actual video iframe */}
                  <div className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <p className="text-sm">Video player would load here</p>
                    <p className="mt-2 text-xs">
                      Replace with YouTube/Vimeo embed or custom video player
                    </p>
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom info bar */}
            <div className={`border-t p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    <span className="font-semibold">2:15</span> duration
                  </span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    • Updated March 2026
                  </span>
                </div>
                <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  10,000+ views
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights below video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {[
            { title: 'Upload documents', description: 'Drag & drop PDF, DOCX, TXT files' },
            { title: 'Ask questions', description: 'Natural language, no special syntax' },
            { title: 'Get instant answers', description: 'With source citations & context' },
          ].map((item, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 text-center ${
                isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'
              }`}
            >
              <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {item.title}
              </p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {item.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
