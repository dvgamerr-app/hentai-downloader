import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  configLoaded: () => ipcRenderer.invoke('CONFIG_LOADED'),

  clearCookie: () => ipcRenderer.invoke('CLEAR_COOKIE'),

  changeDirectory: () =>
    new Promise((resolve) => {
      ipcRenderer.once('CHANGE_DIRECTORY', (_, dir) => resolve(dir?.[0] || ''))
      ipcRenderer.send('CHANGE_DIRECTORY')
    }),

  cancel: () => {
    ipcRenderer.removeAllListeners('INIT_MANGA')
    ipcRenderer.removeAllListeners('URL_VERIFY')
    ipcRenderer.removeAllListeners('DOWNLOAD_WATCH')
    ipcRenderer.removeAllListeners('DOWNLOAD_COMPLETE')
    ipcRenderer.removeAllListeners('LOGIN')
    ipcRenderer.send('CANCEL')
  },

  urlVerify: (url) =>
    new Promise((resolve) => {
      ipcRenderer.once('URL_VERIFY', (_, res) => resolve(res))
      ipcRenderer.send('URL_VERIFY', url)
    }),

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

  login: (cookie) =>
    new Promise((resolve) => {
      ipcRenderer.once('LOGIN', (_, data) => resolve(data))
      ipcRenderer.send('LOGIN', cookie)
    }),

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
