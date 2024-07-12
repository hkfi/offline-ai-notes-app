import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { Note } from 'src/db/schema'

export function NoteCard({ note }: { note: Note }) {
  const { id } = useParams()

  return (
    <Link
      className={`flex flex-col whitespace-nowrap overflow-ellipsis overflow-hidden ${Number(id) === note?.id ? 'bg-muted' : ''} hover:bg-muted p-1`}
      to={`/notes/${note.id}`}
    >
      {note.content.length === 0 ? (
        <span className="text-sm text-muted-foreground italic">Empty</span>
      ) : (
        <span className="text-sm overflow-hidden text-ellipsis">{note.content}</span>
      )}
      <span className="text-xs text-gray-600">
        {note.updatedAt ? format(note.updatedAt, 'E, PP') : null}
      </span>
    </Link>
  )
}
