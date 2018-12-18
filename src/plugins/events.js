import { app, dialog, ipcMain, ipcRenderer } from 'electron'
import * as hentai from './ehentai.js'
import Q from 'q'

const settings = require('electron-settings')
const touno = require('./config')
const isDev = process.env.NODE_ENV === 'development'
console.log('development:', isDev)
// process.env.NODE_ENV === 'development'

let config = settings.get('config')
if (!config || !(config || {}).directory) {
  // console.log('config:', config)
  settings.set('config', { directory: app.getPath('downloads') })
}

export function server (mainWindow) {
  ipcMain.on('CHANGE_DIRECTORY', function (e, source) {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    }, fileNames => {
      if (fileNames) settings.set('config', { directory: fileNames[0] })
      e.sender.send('CHANGE_DIRECTORY', fileNames)
    })
  })
  ipcMain.on('URL_VERIFY', function (e, url) {
    hentai.init(url, e.sender).then(async manga => {
      // Request Send Manga
      await touno.api({
        url: '/exhentai',
        data: {}
      })

      e.sender.send('URL_VERIFY', { error: false, data: manga })
    }).catch(ex => {
      e.sender.send('URL_VERIFY', { error: ex.toString(), data: {} })
    })
  })
  ipcMain.on('DOWNLOAD_BEGIN', function (e, sender) {
    hentai.emiter.download(sender.manga, sender.directory, e.sender).then(() => {
      e.sender.send('DOWNLOAD_COMPLATE')
    }).catch(e => {
      // console.log('DOWNLOAD_COMPLATE', e)
    })
  })
  ipcMain.on('LOGIN', function (e, account) {
    if (account.username.trim() !== '' || account.password.trim() !== '') {
      // console.log('LOGIN', account)
      hentai.login(account.username.trim(), account.password.trim()).then(raw => {
        let getName = /You are now logged in as:(.*?)<br/ig.exec(raw.body)
        if (getName) {
          // console.log(`Login: ${getName[1]}`)
          settings.set('config', { username: account.username, password: account.password, name: getName[1], cookie: raw.headers['set-cookie'] })
          e.sender.send('LOGIN', { success: true, name: getName[1], cookie: raw.headers['set-cookie'] })
        } else {
          let message = /"errorwrap"[\w\W]*?<p>(.*?)</ig.exec(raw.body)[1]
          e.sender.send('LOGIN', { success: false, message: message })
        }
      }).catch(ex => {
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
        ConfigLoaded: () => {
          return settings.get('config')
        },
        ConfigSaved: config => {
          settings.set('config', Object.assign(settings.get('config'), config))
        },
        TounoIO: ($http, uri, data) => {
          const endpoint = 'https://opensource.api-v2.touno.io'
          const token = 'JJpeNu1VAXuHk505.app-exhentai'
          return new Promise((resolve, reject) => {
            $http({
              method: 'POST',
              headers: { 'X-Token': token, 'X-Access': +new Date() },
              data: data || {},
              timeout: 5000,
              json: true,
              url: `${endpoint}${uri}`
            }).then(data => {
              resolve(data)
            }).catch(ex => {
              console.log('TounoIO:', ex.message)
              resolve(null)
            })
          })
        },
        ExUser: (data) => {
          let def = Q.defer()
          ipcRenderer.send('CHANGE_DIRECTORY')
          ipcRenderer.once('CHANGE_DIRECTORY', (e, dir) => def.resolve(dir ? dir[0] : ''))
          return def.promise
        },
        CHANGE_DIRECTORY: () => {
          let def = Q.defer()
          ipcRenderer.send('CHANGE_DIRECTORY')
          ipcRenderer.once('CHANGE_DIRECTORY', (e, dir) => def.resolve(dir ? dir[0] : ''))
          return def.promise
        },
        URL_VERIFY: url => {
          let def = Q.defer()
          ipcRenderer.once('URL_VERIFY', (e, res) => def.resolve(res))
          ipcRenderer.send('URL_VERIFY', url)
          return def.promise
        },
        INIT_MANGA: callback => {
          ipcRenderer.removeAllListeners('INIT_MANGA')
          ipcRenderer.on('INIT_MANGA', (e, sender) => callback(sender))
        },
        DOWNLOAD: (manga, events) => {
          let def = Q.defer()
          ipcRenderer.removeAllListeners('DOWNLOAD_WATCH')
          ipcRenderer.removeAllListeners('DOWNLOAD_COMPLATE')
          ipcRenderer.on('DOWNLOAD_WATCH', events)
          ipcRenderer.on('DOWNLOAD_COMPLATE', (e, data) => { def.resolve() })
          ipcRenderer.send('DOWNLOAD_BEGIN', manga)
          return def.promise
        },
        LOGIN: (user, pass) => {
          let def = Q.defer()
          ipcRenderer.removeAllListeners('LOGIN')
          ipcRenderer.on('LOGIN', (e, data) => { def.resolve(data) })
          ipcRenderer.send('LOGIN', { username: user, password: pass })
          return def.promise
        }
      },
      created () {
        // ipcRenderer.send('LOGIN')
        console.log('created `vue-mbos.js`mixin.')
      }
    })
  }
}
