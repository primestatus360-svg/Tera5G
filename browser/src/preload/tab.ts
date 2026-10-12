import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('tab', {
  navigate: (url: string) => ipcRenderer.send('go', url),
  home:     ()            => ipcRenderer.send('home'),

  payInitiate:    (data: { phone: string; plan: string; provider: string }) =>
    ipcRenderer.invoke('pay-initiate', data),
  payStatus:      (sessionId: string) =>
    ipcRenderer.invoke('pay-status', sessionId),
  payRedeem:      (code: string) =>
    ipcRenderer.invoke('pay-redeem', code),
  onPayConfirmed: (cb: (data: { plan: string; expiresAt: number }) => void) =>
    ipcRenderer.on('pay-confirmed', (_, d) => cb(d)),
})
