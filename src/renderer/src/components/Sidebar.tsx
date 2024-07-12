import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@renderer/ui/Button'
import type { Note } from '../../../db/schema'
import { Search } from './Search'
import { NoteCard } from './NoteCard'

export function Sidebar() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    window.ipcRenderer.invoke('getNotes', { offset: 0 }).then((res) => {
      setNotes(res)
    })
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        navigate('/new-note')
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        navigate('/')
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const createNoteSuccessListener = window.ipcRenderer.on('createNote-success-sidebar', () => {
      window.ipcRenderer.invoke('getNotes', { offset: 0 }).then((res) => {
        setNotes(res)
      })
    })
    const updateNoteSuccessListener = window.ipcRenderer.on('updateNote-success', () => {
      window.ipcRenderer.invoke('getNotes', { offset: 0 }).then((res) => {
        setNotes(res)
      })
    })
    const deleteNoteSuccessListener = window.ipcRenderer.on('deleteNote-success', () => {
      window.ipcRenderer.invoke('getNotes', { offset: 0 }).then((res) => {
        setNotes(res)
      })
    })

    return () => {
      createNoteSuccessListener()
      updateNoteSuccessListener()
      deleteNoteSuccessListener()
    }
  }, [])

  return (
    <div className="h-full w-full flex flex-col justify-between">
      <div className="flex flex-col flex-grow overflow-auto">
        <Button asChild size="sm" variant="link">
          <Link to="/">Notes App</Link>
        </Button>

        <Search />

        <div className="flex flex-col flex-grow relative">
          <div className="absolute inset-0 overflow-auto">
            {notes.map((note, i) => (
              <NoteCard key={i} note={note} />
            ))}
          </div>
        </div>
      </div>
      <Button
        className="flex w-full justify-between gap-2"
        variant="ghost"
        size="sm"
        onClick={() => {
          navigate('/new-note')
        }}
      >
        <span className="text-sm text-muted-foreground">New Note</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>N
        </kbd>
      </Button>
    </div>
  )
}
