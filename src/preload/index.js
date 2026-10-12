import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const requestOnce = (channel, transform, ...args) =>
  new Promise((resolve) => {
    ipcRenderer.once(channel, (_, data) => resolve(transform(data)))
    ipcRenderer.send(channel, ...args)
  })

const api = {
  configLoaded: () => ipcRenderer.invoke('CONFIG_LOADED'),

  clearCookie: () => ipcRenderer.invoke('CLEAR_COOKIE'),

  changeDirectory: () => requestOnce('CHANGE_DIRECTORY', (directories) => directories?.[0] || ''),

  cancel: () => {
    ipcRenderer.removeAllListeners('INIT_MANGA')
    ipcRenderer.removeAllListeners('URL_VERIFY')
    ipcRenderer.removeAllListeners('DOWNLOAD_WATCH')
    ipcRenderer.removeAllListeners('DOWNLOAD_COMPLETE')
    ipcRenderer.removeAllListeners('LOGIN')
    ipcRenderer.send('CANCEL')
  },

  urlVerify: (url) => requestOnce('URL_VERIFY', (result) => result, url),

  initManga: (callback) => {
    ipcRenderer.removeAllListeners('INIT_MANGA')
    ipcRenderer.on('INIT_MANGA', (_, data) => callback(data))
  },

  download: (data, onWatch) =>
    new Promise((resolve) => {
      ipcRenderer.removeAllListeners('DOWNLOAD_WATCH')
      ipcRenderer.removeAllListeners('DOWNLOAD_COMPLETE')
      ipcRenderer.on('DOWNLOAD_WATCH', (_, manga) => onWatch(manga))
      ipcRenderer.once('DOWNLOAD_COMPLETE', () => resolve())
      ipcRenderer.send('DOWNLOAD_BEGIN', data)
    }),

  login: (cookie) => requestOnce('LOGIN', (result) => result, cookie),

  clipboard: (onPaste) => {
    ipcRenderer.removeAllListeners('CLIPBOARD')
    ipcRenderer.send('CLIPBOARD')
    ipcRenderer.on('CLIPBOARD', (_, data) => onPaste(data))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
