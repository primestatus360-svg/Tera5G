import { contextBridge, ipcRenderer } from 'electron'

export interface NavState {
  url?: string; canBack?: boolean; canFwd?: boolean; loading?: boolean
}
export interface TabItem {
  id: string; url: string; title: string; loading: boolean
}
export interface TabsState {
  list: TabItem[]; activeId: string
}

contextBridge.exposeInMainWorld('browser', {
  platform: process.platform,

  // Navigation
  go:       (url: string) => ipcRenderer.send('go', url),
  back:     ()            => ipcRenderer.send('back'),
  fwd:      ()            => ipcRenderer.send('fwd'),
  reload:   ()            => ipcRenderer.send('reload'),
  stop:     ()            => ipcRenderer.send('stop'),
  home:     ()            => ipcRenderer.send('home'),
  getProxy: ()            => ipcRenderer.invoke('get-proxy'),

  // Tabs
  newTab:    ()            => ipcRenderer.send('new-tab'),
  closeTab:  (id: string) => ipcRenderer.send('close-tab', id),
  switchTab: (id: string) => ipcRenderer.send('switch-tab', id),

  // Events
  onNav:  (cb: (s: NavState)   => void) => ipcRenderer.on('nav',  (_, d) => cb(d)),
  onTabs: (cb: (s: TabsState)  => void) => ipcRenderer.on('tabs', (_, d) => cb(d)),
})
