import { app, clipboard, dialog, ipcMain, ipcRenderer } from 'electron'
import * as hentai from './ehentai.js'

const settings = require('electron-settings')
// const touno = require('./config')
// const isDev = process.env.NODE_ENV === 'development'
// process.env.NODE_ENV === 'development'

let config = settings.get('directory')
if (!settings.get('directory')) {
  console.log('directory:', config)
  settings.set('directory', app.getPath('downloads'))
}
export function onClick (menuItem) {
  console.log(menuItem)
}
export function initMain (mainWindow, appIcon) {
  const text = clipboard.readText()
  console.log(text, appIcon)

  // settings.delete('config')
  ipcMain.on('SESSION', function (e) {
    hentai.reload().then(() => {
      return hentai.cookie('ipb_member_id')
    }).then(data => {
      if (!data) {
        settings.delete('igneous')
        settings.delete('config')
      }
      if (!settings.get('ontop', false)) {
        mainWindow.setAlwaysOnTop(false)
        mainWindow.setMovable(true)
      }
      e.sender.send('SESSION', data ? data.value : null)
    }).catch(ex => {
      console.log(ex)
      e.sender.send('SESSION', null)
    })
  })
  ipcMain.on('CHANGE_DIRECTORY', function (e) {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    }, fileNames => {
      if (fileNames) settings.set('directory', fileNames[0])
      e.sender.send('CHANGE_DIRECTORY', fileNames)
    })
  })
  ipcMain.on('URL_VERIFY', function (e, url) {
    hentai.parseHentai(url, e.sender).then(async manga => {
      // Request Send Manga
      // await touno.api({
      //   url: '/exhentai',
      //   data: {}
      // })

      e.sender.send('URL_VERIFY', { error: false, data: manga })
    }).catch(ex => {
      e.sender.send('URL_VERIFY', { error: ex.toString(), data: {} })
    })
  })
  ipcMain.on('DOWNLOAD_BEGIN', function (e, sender) {
    hentai.download(sender.manga, sender.directory, e.sender).then(() => {
      e.sender.send('DOWNLOAD_COMPLATE')
    }).catch(e => {
      console.log('DOWNLOAD_COMPLATE', e)
    })
  })
  ipcMain.on('LOGIN', function (e, account) {
    if (account.username.trim() !== '' || account.password.trim() !== '') {
      console.log('LOGIN', account)
      hentai.login(account.username.trim(), account.password.trim()).then(raw => {
        let getName = /You are now logged in as:(.*?)<br/ig.exec(raw.body)
        if (getName) {
          console.log(`Login: ${getName[1]}`)
          settings.set('config', { username: account.username, password: account.password, name: getName[1], cookie: true })
          // hentai.cookie('ipb_member_id').then(data => {
          //   e.sender.send('SESSION', data)
          // }).catch(ex => {
          //   console.log(ex)
          //   e.sender.send('SESSION', null)
          // })
          e.sender.send('LOGIN', { success: true, name: getName[1], cookie: true })
        } else {
          let message = /"errorwrap"[\w\W]*?<p>(.*?)</ig.exec(raw.body)[1]
          e.sender.send('LOGIN', { success: false, message: message })
        }
      }).catch(ex => {
        console.log(ex)
        e.sender.send('LOGIN', { success: false, message: ex.message })
      })
    } else {
      e.sender.send('LOGIN', { success: false, message: 'This field is empty.' })
    }
  })
}
export const client = {
  config: {},
  install: Vue => {
    Vue.mixin({
      methods: {
        getIgneous: () => {
          return settings.get('igneous')
        },
        setIgneous: (igneous) => {
          return settings.set('igneous', igneous)
        },
        ConfigLoaded: () => {
          const config = settings.get('config') || {}
          const directory = settings.get('directory')
          console.log('Config :: ', config)
          console.log('Config :: ', directory)
          return Object.assign(config, { directory })
        },
        ConfigSaved: config => {
          console.log('ConfigSaved :: ', config)
          settings.set('config', Object.assign(settings.get('config'), config))
        },
        ExUser: () => {
          return new Promise((resolve) => {
            console.log('ipc-send::CHANGE_DIRECTORY')
            ipcRenderer.send('CHANGE_DIRECTORY')
            ipcRenderer.once('CHANGE_DIRECTORY', (e, dir) => {
              console.log('ipc-once::CHANGE_DIRECTORY:', dir)
              resolve(dir ? dir[0] : '')
            })
          })
        },
        CANCEL: () => {
          return new Promise((resolve) => {
            console.log('ipc-remove::CANCEL')
            ipcRenderer.removeAllListeners('INIT_MANGA')
            ipcRenderer.removeAllListeners('URL_VERIFY')
            ipcRenderer.removeAllListeners('DOWNLOAD_WATCH')
            ipcRenderer.removeAllListeners('DOWNLOAD_COMPLATE')
            ipcRenderer.removeAllListeners('LOGIN')
            resolve()
          })
        },
        CHANGE_DIRECTORY: () => {
          return new Promise((resolve) => {
            console.log('ipc-send::CHANGE_DIRECTORY')
            ipcRenderer.send('CHANGE_DIRECTORY')
            ipcRenderer.once('CHANGE_DIRECTORY', (e, dir) => {
              console.log('ipc-once::CHANGE_DIRECTORY:', dir)
              resolve(dir ? dir[0] : '')
            })
          })
        },
        URL_VERIFY: url => {
          return new Promise((resolve) => {
            ipcRenderer.once('URL_VERIFY', (e, res) => {
              console.log('ipc-once::URL_VERIFY:', res)
              resolve(res)
            })
            console.log('ipc-send::URL_VERIFY:', url)
            ipcRenderer.send('URL_VERIFY', url)
          })
        },
        INIT_MANGA: callback => {
          ipcRenderer.removeAllListeners('INIT_MANGA')
          ipcRenderer.on('INIT_MANGA', (e, sender) => {
            console.log('ipc-on::INIT_MANGA', sender)
            callback(sender)
          })
        },
        DOWNLOAD: (manga, events) => {
          return new Promise((resolve) => {
            ipcRenderer.removeAllListeners('DOWNLOAD_WATCH')
            ipcRenderer.removeAllListeners('DOWNLOAD_COMPLATE')
            ipcRenderer.on('DOWNLOAD_WATCH', (e, manga) => {
              console.log('ipc-on::DOWNLOAD_WATCH:', manga)
              return events(e, manga)
            })
            ipcRenderer.on('DOWNLOAD_COMPLATE', () => {
              console.log('ipc-on::DOWNLOAD_COMPLATE')
              resolve()
            })
            console.log('ipc-send::DOWNLOAD_BEGIN:', manga)
            ipcRenderer.send('DOWNLOAD_BEGIN', manga)
          })
        },
        LOGIN: (user, pass) => {
          return new Promise((resolve) => {
            ipcRenderer.removeAllListeners('LOGIN')
            ipcRenderer.on('LOGIN', (e, data) => {
              console.log('ipc-on::LOGIN')
              resolve(data)
            })
            console.log('ipc-send::LOGIN')
            ipcRenderer.send('LOGIN', { username: user, password: pass })
          })
        },
        SESSION: () => {
          return new Promise((resolve) => {
            ipcRenderer.removeAllListeners('SESSION')
            console.log('ipc-send::SESSION')
            ipcRenderer.send('SESSION')
            ipcRenderer.on('SESSION', (e, data) => {
              console.log('ipc-on::SESSION')
              resolve(data)
            })
          })
        }
      },
      created () {
        // ipcRenderer.send('LOGIN')
        // console.log('created `vue-mbos.js`mixin.')
      }
    })
  }
}
