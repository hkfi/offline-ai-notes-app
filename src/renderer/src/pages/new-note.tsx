import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { useDebounce } from 'use-debounce'

export function NewNote() {
  const navigate = useNavigate()
  const [noteContent, setNoteContent] = useState<undefined | string>('')
  const [loading, setLoading] = useState(false)

  const [noteContentVal] = useDebounce(noteContent, 500)

  const handleCreateNote = () => {
    if (!noteContentVal || loading) return
    window.ipcRenderer.send('createNote', noteContentVal)
    setLoading(true)
  }

  useEffect(() => {
    handleCreateNote()
  }, [noteContentVal])

  useEffect(() => {
    const noteCreatedListener = window.ipcRenderer.on('createNote-success', (_, createdNote) => {
      setLoading(false)
      setNoteContent('')
      navigate(`/notes/${createdNote.id}`)
    })

    const noteCreateFailedListener = window.ipcRenderer.on(
      'createNote-failed',
      (_, errorMessage) => {
        console.error('error: ', errorMessage)
      }
    )

    return () => {
      noteCreatedListener()
      noteCreateFailedListener()
    }
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleCreateNote()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [handleCreateNote])

  return (
    <div data-color-mode="light" className="flex-grow h-full flex flex-col">
      <MDEditor
        aria-disabled={loading}
        color="white"
        preview="edit"
        className="flex-grow"
        value={noteContent}
        onChange={setNoteContent}
        autoFocus
      />
    </div>
  )
}
