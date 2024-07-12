import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { useDebounce } from 'use-debounce'
import { Separator } from '@renderer/ui/Separator'
import type { Note as TNote } from '../../../db/schema'
import { LoadingSpinner } from '@renderer/ui/LoadingSpinner'
import { Check, Trash } from 'lucide-react'
import { NoteCard } from '@renderer/components/NoteCard'

export function Note() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [touched, setTouched] = useState(false)
  const [noteContent, setNoteContent] = useState<undefined | string>('')
  const [loading, setLoading] = useState(false)
  const [relatedNotes, setRelatedNotes] = useState<TNote[]>([])
  const [noteContentVal] = useDebounce(noteContent, 500)

  const handleSave = () => {
    if (!id || !noteContentVal || loading || !touched) return
    window.ipcRenderer.send('updateNote', { id: Number(id), content: noteContentVal })
    setLoading(true)
  }

  useEffect(() => {
    handleSave()
  }, [noteContentVal])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [handleSave])

  useEffect(() => {
    if (!id) return
    window.ipcRenderer.invoke('getNote', Number(id)).then((note) => {
      setNoteContent(note.content)
    })
    setTouched(false)
  }, [id])

  useEffect(() => {
    const updateNoteSuccessListener = window.ipcRenderer.on('updateNote-success', (_) => {
      window.ipcRenderer.invoke('findSimilarNotes', Number(id)).then((res) => {
        setRelatedNotes(res)
      })
      setLoading(false)
    })

    const updateNoteFailedListener = window.ipcRenderer.on(
      'updateNote-failed',
      (_, errorMessage) => {
        console.error('error: ', errorMessage)
      }
    )

    return () => {
      updateNoteSuccessListener()
      updateNoteFailedListener()
    }
  }, [])

  useEffect(() => {
    window.ipcRenderer.invoke('findSimilarNotes', Number(id)).then((res) => {
      setRelatedNotes(res)
    })
  }, [id])

  return (
    <div className="flex flex-grow">
      <div data-color-mode="light" className="flex flex-col flex-grow h-full relative">
        {/* <div>{note.createdAt.getTime()}</div> */}
        <MDEditor
          color="white"
          preview="edit"
          className="flex-grow"
          value={noteContent}
          onChange={(val) => {
            if (!touched) {
              setTouched(true)
            }
            setNoteContent(val)
          }}
          autoFocus
        />
        <div className="absolute bottom-0 right-0 z-50 bg-white flex gap-2">
          <Trash
            onClick={() => {
              window.ipcRenderer.send('deleteNote', id)
              navigate(`/`)
            }}
            className="w-4 h-4 text-gray-400 hover:text-primary cursor-pointer"
          />

          <div className="text-gray-400">
            {loading ? <LoadingSpinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </div>
        </div>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col w-40">
        <div className="p-2 text-center text-sm text-primary">Related notes</div>
        {relatedNotes.map((note, i) => {
          if (note?.id === Number(id)) return null
          return <NoteCard key={i} note={note} />
        })}
      </div>
    </div>
  )
}
