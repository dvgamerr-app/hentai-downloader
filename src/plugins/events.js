import { dialog, ipcMain, ipcRenderer } from 'electron'
import * as hentai from './ehentai.js'
import Q from 'q'

export function server (mainWindow) {
  ipcMain.on('CHANGE_DIRECTORY', function (e, source) {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    }, fileNames => {
      e.sender.send('CHANGE_DIRECTORY', fileNames)
    })
  })
  ipcMain.on('URL_VERIFY', function (e, url) {
    hentai.init(url).then(manga => {
      e.sender.send('URL_VERIFY', manga)
    }).catch(e => {
      console.log('URL_VERIFY', e)
    })
  })
}
export const client = {
  config: {},
  install: Vue => {
    Vue.mixin({
      methods: {
        CHANGE_DIRECTORY: () => {
          let def = Q.defer()
          ipcRenderer.send('CHANGE_DIRECTORY')
          ipcRenderer.once('CHANGE_DIRECTORY', (e, dir) => {
            console.log('CHANGE_DIRECTORY', dir ? dir[0] : '')
            def.resolve(dir ? dir[0] : '')
          })
          return def.promise
        },
        URL_VERIFY: url => {
          let def = Q.defer()
          ipcRenderer.send('URL_VERIFY', url)
          ipcRenderer.once('URL_VERIFY', (e, manga) => {
            def.resolve(manga)
          })
          return def.promise
        }
      },
      created () {
        // console.log('created `vue-mbos.js`mixin.')
      }
    })
  }
}
