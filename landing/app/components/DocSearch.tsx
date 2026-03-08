'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DocSearchProps {
  // kept for compatibility with previous usage; Zensical will use env vars
  apiKey?: string
  appId?: string
  indexName?: string
}

type ZensicalResult = {
  title: string
  url: string
  excerpt?: string
}

export function DocSearch(_: DocSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ZensicalResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if ((mod && e.key.toLowerCase() === 'k') || (e.key === '/' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const abort = new AbortController()
    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const base = process.env.NEXT_PUBLIC_ZENSICAL_API_URL ?? process.env.NEXT_PUBLIC_ZENSICAL_URL
        if (!base) {
          setResults([])
          setIsLoading(false)
          return
        }
        const url = `${base.replace(/\/$/, '')}/search?q=${encodeURIComponent(query)}`
        const res = await fetch(url, { signal: abort.signal })
        if (!res.ok) throw new Error('Search failed')
        const json = await res.json()
        // expect { results: [{title, url, excerpt}] } — adapt if your API differs
        setResults(json.results ?? [])
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    const t = setTimeout(fetchResults, 150)
    return () => {
      abort.abort()
      clearTimeout(t)
    }
  }, [query])

  return (
    <>
      <button
        type="button"
        className="DocSearch DocSearch-Button"
        onClick={open}
        aria-label="Open documentation search"
      >
        <span className="DocSearch-Button-Container">
          <svg width="20" height="20" className="DocSearch-Search-Icon" viewBox="0 0 20 20">
            <path d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="DocSearch-Button-Placeholder">Search documentation...</span>
        </span>
        <span className="DocSearch-Button-Keys">
          <kbd className="DocSearch-Button-Key">⌘</kbd>
          <kbd className="DocSearch-Button-Key">K</kbd>
        </span>
      </button>

      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-lg ring-1 ring-black/5">
              <div className="p-4">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                    placeholder="Search documentation..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') close()
                    }}
                  />
                  <button onClick={close} className="px-3">Close</button>
                </div>
                <div className="mt-3 max-h-72 overflow-auto">
                  {isLoading && <div className="p-4">Searching…</div>}
                  {!isLoading && results.length === 0 && query && <div className="p-4">No results</div>}
                  <ul>
                    {results.map((r, i) => (
                      <li key={i} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <a href={r.url} onClick={() => close()} className="block">
                          <div className="font-medium">{r.title}</div>
                          {r.excerpt && <div className="text-sm text-slate-600 dark:text-slate-400">{r.excerpt}</div>}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
