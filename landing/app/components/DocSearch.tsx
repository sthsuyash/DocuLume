'use client'

import { useEffect } from 'react'
import { DocSearchModal, useDocSearchKeyboardEvents } from '@docsearch/react'
import { createPortal } from 'react-dom'
import { useState, useCallback } from 'react'
import '@docsearch/css'

interface DocSearchProps {
  apiKey: string
  appId: string
  indexName: string
}

export function DocSearch({ apiKey, appId, indexName }: DocSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState<string>('')

  const onOpen = useCallback(() => {
    setIsOpen(true)
  }, [setIsOpen])

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const onInput = useCallback(
    (event: KeyboardEvent) => {
      setIsOpen(true)
      setInitialQuery(event.key)
    },
    [setIsOpen, setInitialQuery]
  )

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
  })

  return (
    <>
      <button
        type="button"
        className="DocSearch DocSearch-Button"
        onClick={onOpen}
      >
        <span className="DocSearch-Button-Container">
          <svg
            width="20"
            height="20"
            className="DocSearch-Search-Icon"
            viewBox="0 0 20 20"
          >
            <path
              d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
              stroke="currentColor"
              fill="none"
              fillRule="evenodd"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="DocSearch-Button-Placeholder">Search documentation...</span>
        </span>
        <span className="DocSearch-Button-Keys">
          <kbd className="DocSearch-Button-Key">⌘</kbd>
          <kbd className="DocSearch-Button-Key">K</kbd>
        </span>
      </button>

      {isOpen &&
        createPortal(
          <DocSearchModal
            apiKey={apiKey}
            appId={appId}
            indexName={indexName}
            onClose={onClose}
            initialScrollY={window.scrollY}
            initialQuery={initialQuery}
            placeholder="Search documentation..."
            translations={{
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search',
              },
            }}
          />,
          document.body
        )}
    </>
  )
}
