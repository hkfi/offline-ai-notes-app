import { Outlet } from 'react-router-dom'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@renderer/ui/Resizable'
import { Sidebar } from '../components/Sidebar'

export function Root() {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex !h-screen">
      <ResizablePanel minSize={15} defaultSize={15}>
        <Sidebar />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel className="flex-col flex">
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
