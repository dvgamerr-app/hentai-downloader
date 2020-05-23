import { app, BrowserWindow, Tray } from 'electron'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import path from 'path'

import hentai from '../plugins/ehentai.js'
import * as vEvents from '../plugins/events'

// let appIcon
let mainWindow
let mainConfig
const router = express()
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

function createWindow () {
  /**
   * Initial window options
   */

  mainConfig = {
    width: 600,
    height: 360,
    minWidth: 600,
    minHeight: 360,
    maxWidth: 600,
    maxHeight: 360,
    'node-integration': false,
    title: app.getName(),
    icon: path.join(__dirname, '../../build/icons/icon.ico'),
    show: true,
    // frame: false,
    movable: true,
    resizable: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    transparent: false
  }

  // const padding = 10
  // var screenSize = screen.getPrimaryDisplay().workAreaSize
  // mainConfig.x = screenSize.width - mainConfig.width - padding
  // mainConfig.y = screenSize.height - mainConfig.height - padding

  mainWindow = new BrowserWindow(mainConfig)
  mainWindow.loadURL(winURL)
  mainWindow.setMenu(null)

  let appIcon = new Tray(path.join(__dirname, '../../build/icons/16x16.png'))
  let hideWindow = false

  appIcon.setToolTip('Hentai Downloader 2.2.0')
  appIcon.on('click', (e) => {
    if (hideWindow) {
      mainWindow.show()
    } else {
      mainWindow.hide()
    }
  })

  mainWindow.on('show', () => {
    hideWindow = !hideWindow
  })

  mainWindow.on('hide', () => {
    hideWindow = !hideWindow
  })

  mainWindow.on('closed', () => {
    appIcon.destroy()
    mainWindow = null
  })

  vEvents.server(mainWindow)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: false }))

router.post('/token', async (req, res) => {
  try {
    if (req.body) {
      const { cookie } = req.body
      console.log('TOKEN:', cookie)
      console.log('setCookie:', hentai.setCookie)
      res.json({ token: true })
    } else {
      res.json({ token: false })
    }
  } catch (ex) {
    console.log(ex)
    res.status(404)
  } finally {
    res.end()
  }
})

router.listen(34841, '127.0.0.1', () => {
  console.log('listen port 34841 ready.')
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
