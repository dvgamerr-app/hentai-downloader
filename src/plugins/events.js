import { dialog, ipcMain, ipcRenderer } from 'electron'
import * as hentai from './ehentai.js'
import Q from 'q'

const settings = require('electron-settings')

export function server (mainWindow) {
  ipcMain.on('CHANGE_DIRECTORY', function (e, source) {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    }, fileNames => {
      settings.set('config', {
        directory: fileNames ? fileNames[0] : ''
      })
      e.sender.send('CHANGE_DIRECTORY', fileNames)
    })
  })
  ipcMain.on('URL_VERIFY', function (e, url) {
    hentai.init(url).then(manga => {
      e.sender.send('URL_VERIFY', { error: false, data: manga })
    }).catch(ex => {
      e.sender.send('URL_VERIFY', { error: ex.toString(), data: {} })
    })
  })
  ipcMain.on('DOWNLOAD_BEGIN', function (e, sender) {
    hentai.emiter.download(sender.manga, sender.directory, e.sender).then(() => {
      e.sender.send('DOWNLOAD_COMPLATE')
    }).catch(e => {
      console.log('DOWNLOAD_COMPLATE', e)
    })
  })
  ipcMain.on('LOGIN', function (e, sender) {
    hentai.login('dvgamer', 'dvg7po8ai').then(raw => {
      let getName = /You are now logged in as:(.*?)<br/ig.exec(raw.body)
      console.log(`https://forums.e-hentai.org/index.php?act=Login&CODE=01`)
      if (getName) {
        console.log(`Login Success: ${getName[1]}`)
        console.log(raw.headers['set-cookie'])
      }
      e.sender.send('LOGIN')
    }).catch(e => {
      console.log('LOGIN', e)
    })
  })
}
export const client = {
  config: {},
  install: Vue => {
    Vue.mixin({
      methods: {
        ConfigLoaded: () => {
          return settings.get('config')
        },
        CHANGE_DIRECTORY: () => {
          let def = Q.defer()
          ipcRenderer.send('CHANGE_DIRECTORY')
          ipcRenderer.once('CHANGE_DIRECTORY', (e, dir) => {
            def.resolve(dir ? dir[0] : '')
          })
          return def.promise
        },
        URL_VERIFY: url => {
          let def = Q.defer()
          ipcRenderer.send('URL_VERIFY', url)
          ipcRenderer.once('URL_VERIFY', (e, res) => {
            def.resolve(res)
          })
          return def.promise
        },
        DOWNLOAD: (manga, events) => {
          let def = Q.defer()
          ipcRenderer.send('DOWNLOAD_BEGIN', manga)
          ipcRenderer.on('DOWNLOAD_WATCH', (e, status) => {
            events(status)
          })
          ipcRenderer.once('DOWNLOAD_COMPLATE', (e, manga) => {
            ipcRenderer.removeListener('DOWNLOAD_WATCH', (e) => { })
            def.resolve()
          })
          return def.promise
        },
        LOGIN: () => {
          let def = Q.defer()
          ipcRenderer.send('LOGIN')
          return def.promise
        }
      },
      created () {
        // ipcRenderer.send('LOGIN')
        // console.log('created `vue-mbos.js`mixin.')
      }
    })
  }
}
