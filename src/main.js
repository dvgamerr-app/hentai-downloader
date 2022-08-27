const { app, BrowserWindow, Tray, Menu, screen }  = require('electron')
const logger = require('@touno-io/debuger')('window')
const { join } = require('path')
const settings = require('electron-settings')
const pkg = require('../package.json')

const onClick = (e) => {
  console.log(e)
}

if (require('electron-squirrel-startup')) {
  app.quit();
}

settings.configure({ fileName: `${pkg.name}.json`, prettify: true })
logger.log('settings-loaded', settings.SettingsObject)
logger.log('ENV:', process.env)

let mainWindow
let mainConfig
// const router = express()
// const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`
const winURL = `file://${__dirname}/index.html`

// if (process.env.NODE_ENV !== 'development') {
//   global.__static = join(__dirname, '/static').replace(/\\/g, '\\\\')
// }
let width = 600
let height = 345

function createWindow () {
settings.configure()

  mainConfig = {
    width: width,
    height: height,
    minWidth: width,
    minHeight: height,
    maxWidth: width,
    maxHeight: height,
    title: app.getName(),
    icon: join(__dirname, '../../build/icons/icon.ico'),
    show: true,
    // frame: false,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  }
  const getPosition = () => {
    const padding = 10
    if (settings.get('ontop', false)) {
      const screenSize = screen.getPrimaryDisplay().workAreaSize
      if (mainWindow) {
        [ width, height ] = mainWindow.getSize()
        logger.log('screenSize', screenSize, 'width', width, 'height', height)
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
  mainWindow.setAlwaysOnTop(settings.get('ontop', false))
  mainWindow.setMovable(!settings.get('ontop', false))
  mainWindow.setMinimizable(false)

  mainWindow.webContents.openDevTools();

  let appIcon = new Tray(join(__dirname, 'icons/16x16.png'))
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
        // mainWindow.set
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
    logger.log({ x, y })
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

  // initMain(mainWindow, appIcon)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
