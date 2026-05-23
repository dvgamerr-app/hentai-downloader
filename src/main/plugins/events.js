import { app, clipboard, dialog, ipcMain } from 'electron'
import settings from 'electron-settings'
import * as hentai from './ehentai.js'

if (!settings.getSync('directory')) {
  settings.setSync('directory', app.getPath('downloads'))
}

ipcMain.handle('CONFIG_LOADED', () => ({
  directory: settings.getSync('directory') || '',
  igneous: settings.getSync('igneous') || null,
  cookie: settings.getSync('cookie') || ''
}))

ipcMain.handle('CLEAR_COOKIE', () => {
  settings.deleteSync('cookie')
  settings.deleteSync('igneous')
  settings.deleteSync('ipb_member_id')
  settings.deleteSync('ipb_pass_hash')
})

const onWatchClipboard = (e) => {
  let last = null
  setInterval(() => {
    if (!settings.getSync('clipboard', false)) return
    const text = clipboard.readText()
    if (last !== text) {
      e.sender.send('CLIPBOARD', text)
      last = text
    }
  }, 300)
}

export function onClick(menuItem) {
  if (menuItem.role === 'toggle-clipboard') {
    settings.setSync('clipboard', menuItem.checked)
  }
}

export function initMain(mainWindow) {
  ipcMain.on('CLIPBOARD', (e) => onWatchClipboard(e))

  ipcMain.on('CANCEL', (e) => {
    hentai.cancel()
    e.sender.send('CANCEL', null)
  })

  ipcMain.on('CHANGE_DIRECTORY', (e) => {
    const fileNames = dialog.showOpenDialogSync(mainWindow, {
      properties: ['openDirectory']
    })
    if (fileNames?.length > 0) settings.setSync('directory', fileNames[0])
    e.sender.send('CHANGE_DIRECTORY', fileNames)
  })

  ipcMain.on('URL_VERIFY', (e, url) => {
    hentai
      .parseHentai(url, e.sender)
      .then((manga) => e.sender.send('URL_VERIFY', { error: false, data: manga }))
      .catch((ex) => e.sender.send('URL_VERIFY', { error: ex.toString(), data: {} }))
  })

  ipcMain.on('DOWNLOAD_BEGIN', (e, sender) => {
    hentai
      .download(sender.manga, sender.directory, e.sender)
      .then(() => e.sender.send('DOWNLOAD_COMPLATE'))
      .catch((ex) => console.error('DOWNLOAD_COMPLATE error', ex))
  })

  ipcMain.on('LOGIN', (e, cookieString) => {
    settings.deleteSync('igneous')
    settings.deleteSync('ipb_member_id')
    settings.deleteSync('ipb_pass_hash')

    const result = { success: false, igneous: null, ipb_member_id: null, ipb_pass_hash: null }
    let count = 0

    for (const part of cookieString.split(';')) {
      const [key, value] = part.split('=')
      const k = key?.trim()
      const v = value?.trim()
      if (k === 'igneous') { result.igneous = v; settings.setSync('igneous', v); count++ }
      else if (k === 'ipb_member_id') { result.ipb_member_id = v; settings.setSync('ipb_member_id', v); count++ }
      else if (k === 'ipb_pass_hash') { result.ipb_pass_hash = v; settings.setSync('ipb_pass_hash', v); count++ }
    }

    result.success = count === 3
    e.sender.send('LOGIN', result)
  })
}
