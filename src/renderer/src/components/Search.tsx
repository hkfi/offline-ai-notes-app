'use client'

import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

import { CommandDialog, CommandInput, CommandList } from '@renderer/ui/Command'

import { Link } from 'react-router-dom'

import type { Note } from '../../../db/schema'
import { Button } from '@renderer/ui/Button'

export function Search() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const [searchString, setSearchString] = useState('')
  const [query] = useDebounce(searchString, 100)

  const [searchResults, setSearchResults] = useState<Note[]>([])

  useEffect(() => {
    if (query) {
      window.ipcRenderer.invoke('searchNotes', query).then((res) => {
        setSearchResults(res)
      })
    } else {
      setSearchResults([])
    }
  }, [query])

  return (
    <>
      <Button
        className="flex w-full justify-between gap-2"
        variant="ghost"
        size="sm"
        onClick={() => {
          setOpen(true)
        }}
      >
        <span className="text-sm text-muted-foreground">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>F
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search..."
          value={searchString}
          onValueChange={(s) => setSearchString(s)}
        />
        <CommandList>
          <div className="flex flex-col">
            {(searchResults ?? []).map((note, i) => {
              return (
                <Link
                  key={i}
                  to={`/notes/${note.id}`}
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-gray-200"
                >
                  <span>{note.content}</span>
                </Link>
              )
            })}
          </div>
        </CommandList>
      </CommandDialog>
    </>
  )
}
