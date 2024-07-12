import { useEffect, useMemo, useState } from 'react'
import { Note } from '../../../db/schema'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

export function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [, setStatus] = useState('')

  useEffect(() => {
    window.ipcRenderer.invoke('getNotes', { offset: 0 }).then((res) => {
      setNotes(res)
    })
  }, [])

  useEffect(() => {
    window.ipcRenderer.on('createNote-success', () => {
      setStatus('Note created successfully!')

      window.ipcRenderer.invoke('getNotes', { offset: 0 }).then((res) => {
        setNotes(res)
      })
    })

    window.ipcRenderer.on('createNote-failed', (errorMessage) => {
      setStatus(`Failed to create note: ${errorMessage}`)
    })
  }, [])

  const tenMostRecentNotes = useMemo(() => {
    return notes.slice(0, 10)
  }, [notes])

  return (
    <div className="flex flex-wrap overflow-auto h-full">
      {tenMostRecentNotes.map((note, i) => {
        return (
          <Link
            to={`/notes/${note.id}`}
            key={i}
            className="md:basis-1/2 basis-full bg-muted flex flex-col gap-2 hover:bg-gray-200 items-center justify-center p-5 flex-grow"
          >
            <div className="text-sm text-gray-600">
              {note.updatedAt ? format(note.updatedAt, 'E, PP') : null}
            </div>

            <div className="text-lg overflow-hidden text-ellipsis line-clamp-5">{note.content}</div>
          </Link>
        )
      })}
    </div>
  )
}
