import { RouterProvider, createHashRouter } from 'react-router-dom'

import { Note } from './pages/note'
import { NewNote } from './pages/new-note'
import { Root } from './pages/root'
import { Home } from './pages/home'
import { useEffect } from 'react'

import { atom, useAtom } from 'jotai'
import { LoadingSpinner } from './ui/LoadingSpinner'

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/new-note',
        element: <NewNote />
      },
      {
        path: '/notes/:id',
        element: <Note />
      }
    ]
  }
])

const loadingAtom = atom(true)

function App() {
  const [loading, setLoading] = useAtom(loadingAtom)
  useEffect(() => {
    window.ipcRenderer.on('server-ready', () => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    window.ipcRenderer.send('check-server-status')
  }, [])

  console.log(window.location.href)

  return loading ? (
    <div className="h-screen w-screen flex flex-col flex-grow items-center justify-center">
      <div className="text-2xl">NotesApp</div>
      <div>Getting AI Model ready...</div>
      <LoadingSpinner />
    </div>
  ) : (
    <RouterProvider router={router} />
  )
}

export default App
