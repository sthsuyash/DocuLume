"use client"

import { useEffect, useState } from 'react'

export function useLandingTheme() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_FE_URL ?? '#'

  useEffect(() => {
    const savedTheme = localStorage.getItem('landing-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const nextIsDark = savedTheme ? savedTheme === 'dark' : prefersDark

    setIsDark(nextIsDark)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('landing-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return {
    mobileOpen,
    setMobileOpen,
    isDark,
    setIsDark,
    appUrl,
  }
}
