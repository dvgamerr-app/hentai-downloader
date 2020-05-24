import { app, BrowserWindow, Tray, Menu, screen } from 'electron'
import express from 'express'
import cors from 'cors'
import settings from 'electron-settings'
import bodyParser from 'body-parser'
import path from 'path'

// import hentai from '../plugins/ehentai.js'
import { initMain, onClick } from '../plugins/events'

// let appIcon
let mainWindow
let mainConfig
const router = express()
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

function createWindow () {
  mainConfig = {
    width: 600,
    height: 385,
    minWidth: 600,
    minHeight: 385,
    maxWidth: 600,
    maxHeight: 385,
    'node-integration': false,
    title: app.getName(),
    icon: path.join(__dirname, '../../build/icons/icon.ico'),
    show: true,
    // frame: false,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    transparent: false
  }
  const getPosition = () => {
    const padding = 10
    if (settings.get('ontop', false)) {
      const screenSize = screen.getPrimaryDisplay().workAreaSize
      let width = 600
      let height = 345
      if (mainWindow) {
        [ width, height ] = mainWindow.getSize()
        console.log('screenSize', screenSize, 'width', width, 'height', height)
      }
      return {
        x: screenSize.width - width - padding,
        y: screenSize.height - height - padding
      }
    } else {
      return settings.get('position')
    }
  }

  mainWindow = new BrowserWindow(Object.assign(mainConfig, getPosition()))
  mainWindow.loadURL(winURL)
  mainWindow.setMenu(null)
  mainWindow.setSkipTaskbar(settings.get('ontop', false))
  let appIcon = new Tray(path.join(__dirname, process.env.NODE_ENV === 'development' ? '../../static/16x16.png' :'static/16x16.png' ))
  let hideWindow = false

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Always On Top',
      sublabel: 'and lock window mode.',
      type: 'checkbox',
      checked: settings.get('ontop', false),
      click: (menuItem) => {
        settings.set('ontop', menuItem.checked)
        mainWindow.setAlwaysOnTop(menuItem.checked)
        mainWindow.setMovable(!menuItem.checked)
        mainWindow.setSkipTaskbar(menuItem.checked)
        const position = getPosition()
        if (position) mainWindow.setPosition(position.x, position.y)
      }
    },
    { type: 'separator' },
    { label: 'Watch Clipboard', type: 'checkbox', role: 'toggle-clipboard', checked: settings.get('clipboard', false), click: onClick },
    { label: 'Auto Download', type: 'checkbox', role: 'auto-dl', visible: false, checked: false, click: onClick },
    { label: 'Exit', role: 'quit' }
  ])

  appIcon.setContextMenu(contextMenu)
  appIcon.setToolTip('Hentai Downloader 2.2.0')
  appIcon.on('click', () => {
    if (hideWindow) {
      mainWindow.show()
    } else {
      mainWindow.hide()
    }
  })

  const savePosition = () => {
    let [ x, y ] = mainWindow.getPosition()
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const [ winWidth, winHeight ] = mainWindow.getSize()
    if (x < 0) x = 0
    if (x > (width - winWidth)) x = (width - winWidth)
    if (y < 0) y = 0
    if (y > (height - winHeight)) y = (height - winHeight)
    settings.set('position', { x, y })
    console.log({ x, y })
  }
  let moveId = null
  mainWindow.on('moved', () => {
    if (settings.get('ontop', false)) return
    if (moveId) clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })
  mainWindow.on('move', () => {
    if (settings.get('ontop', false)) return
    if (moveId) clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
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

  initMain(mainWindow, appIcon)
}

app.on('ready', () => createWindow())

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: false }))

router.post('/token', async (req, res) => {
  try {
    if (req.body) {
      // const { cookie } = req.body
      // console.log('TOKEN:', cookie)
      // console.log('setCookie:', hentai.setCookie)
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
