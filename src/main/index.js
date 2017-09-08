'use strict'

import { app, BrowserWindow } from 'electron'
import path from 'path'

import * as vEvents from '../plugins/events'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// let appIcon
let mainWindow
let mainConfig
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

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
    icon: path.join(__dirname, 'src/renderer/assets/touno.ico'),
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

  // appIcon = new Tray(path.join(__dirname, '../renderer/assets/stats/icon-offline.png'))
  // var contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Close',
  //     click: () => {
  //       mainWindow.close()
  //     }
  //   }
  // ])

  // appIcon.setToolTip(mainConfig.title)
  // appIcon.setContextMenu(contextMenu)

  // appIcon.on('click', (e, bounds) => {
  //   mainWindow.show()
  // })

  mainWindow = new BrowserWindow(mainConfig)
  console.log('mainWindow>::loadURL', winURL)
  mainWindow.loadURL(winURL)
  mainWindow.setMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('blur', () => {
    // mainWindow.hide()
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
