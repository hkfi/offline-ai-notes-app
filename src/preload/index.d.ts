import { ElectronAPI } from '@electron-toolkit/preload'
import type { Api, IpcRendererApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
    ipcRenderer: IpcRendererApi
  }
}
