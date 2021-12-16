import { app, dialog, ipcMain, ipcRenderer } from 'electron'
import settings from 'electron-settings'
import * as hentai from './ehentai.js'

let config = settings.get('directory')
if (!settings.get('directory')) {
  console.log('directory:', config)
  settings.set('directory', app.getPath('downloads'))
}

export function onClick (menuItem) {
  if (menuItem.role === 'toggle-clipboard') {
    settings.set('clipboard', menuItem.checked)
    hentai.onWatchClipboard()
  }
}

export function initMain (mainWindow, appIcon) {
  hentai.onWatchClipboard()
  console.log(appIcon)
  // settings.delete('config')
  ipcMain.on('CANCEL', function (e) {
    hentai.cancel()
    e.sender.send('CANCEL', null)
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
  ipcMain.on('LOGIN', function (e, cookieString) {
    settings.set('cookie', cookieString)
    console.log(`Login: ${cookieString}`)
    const result = {
      success: false,
      igneous: null,
      ipb_member_id: null,
      ipb_pass_hash: null
    }

    settings.delete('igneous')
    settings.delete('ipb_member_id')
    settings.delete('ipb_pass_hash')

    let countCookie = 0
    for (const cookie of cookieString.split(';')) {
      const [ key, value ] = cookie.split('=')

      if (key.trim() == 'igneous') {
        result.igneous = value.trim()
        settings.set('igneous', value.trim())
        countCookie++
      }
      
      else if (key.trim() == 'ipb_member_id') {
        result.ipb_member_id = value.trim()
        settings.set('ipb_member_id', value.trim())
        countCookie++
      }
      
      else if (key.trim() == 'ipb_pass_hash') {
        result.ipb_pass_hash = value.trim()
        settings.set('ipb_pass_hash', value.trim())
        countCookie++
      }
    }
    if (countCookie == 3) result.success = true
    e.sender.send('LOGIN', result)
    
    // if (igneous !== '') {
    //   console.log('igneous', igneous)
    //   hentai.login(igneous).then(() => {
    //     // let getName = /You are now logged in as:(.*?)<br/ig.exec(raw)
    //     // if (getName) {
    //     console.log(`Login: ${igneous}`)
    //     settings.set('igneous', igneous)
    //     // settings.set('config', { username: igneous.username, password: igneous.password, igneous: igneous, cookie: true })
    //     // hentai.cookie('ipb_member_id').then(data => {
    //     //   e.sender.send('SESSION', data)
    //     // }).catch(ex => {
    //     //   console.log(ex)
    //     //   e.sender.send('SESSION', null)
    //     // })
    //     e.sender.send('LOGIN', { success: true, igneous })
    //   // } else {
    //     //   let message = /"errorwrap"[\w\W]*?<p>(.*?)</ig.exec(raw)[1]
    //     //   e.sender.send('LOGIN', { success: false, message: message })
    //     // }
    //   }).catch(ex => {
    //     console.log(ex)
    //     e.sender.send('LOGIN', { success: false, message: ex.message })
    //   })
    // } else {
    //   e.sender.send('LOGIN', { success: false, message: 'This field is empty.' })
    // }
  })
}
export const client = {
  config: {},
  install: Vue => {
    Vue.mixin({
      methods: {
        clearCookie: () => {
          settings.delete('cookie')
          settings.delete('igneous')
          settings.delete('ipb_member_id')
          settings.delete('ipb_pass_hash')
        },
        ConfigLoaded: () => {
          return Object.assign(settings.get('config') || {}, {
            directory: settings.get('directory'),
            igneous: settings.get('igneous'),
            cookie: settings.get('cookie')
          })
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
            ipcRenderer.send('CANCEL')
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
        LOGIN: (cookie) => {
          return new Promise((resolve) => {
            ipcRenderer.removeAllListeners('LOGIN')
            ipcRenderer.on('LOGIN', (e, data) => {
              console.log('ipc-on::LOGIN')
              resolve(data)
            })
            console.log('ipc-send::LOGIN')
            ipcRenderer.send('LOGIN', cookie)
          })
        },
        CLIPBOARD: (vm) => {
          console.log('ipc-on::CLIPBOARD', vm)
          ipcRenderer.removeAllListeners('CLIPBOARD')
          ipcRenderer.send('CLIPBOARD')
          ipcRenderer.on('CLIPBOARD', () => {
            console.log('ipc-on::CLIPBOARD')
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
