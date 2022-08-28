const { app, BrowserWindow, Tray, Menu, screen }  = require('electron')
const logger = require('@touno-io/debuger')('window')
const { join } = require('path')
const settings = require('electron-settings')
const pkg = require('../package.json')

if (require('electron-squirrel-startup')) {
  app.quit();
}

const onClick = (e) => {
  console.log(e)
}

settings.configure({ fileName: `${pkg.name}.json`, prettify: true })
logger.log('settings-loaded', settings.SettingsObject)
logger.log('env:', process.env.NODE_ENV)
logger.log('App:', app.getName())

const mainApp = {
  url: `file://${__dirname}/index.html`,
  // // eslint-disable-next-line no-undef
  // url: MAIN_WINDOW_WEBPACK_ENTRY,
  window: null,
  tray: null,
  config: {},
  width: 600,
  height: 380
}

// const router = express()
// const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`

// if (process.env.NODE_ENV !== 'development') {
//   global.__static = join(__dirname, '/static').replace(/\\/g, '\\\\')
// }

function createWindow () {
  mainApp.config = {
    width: mainApp.width,
    height: mainApp.height,
    minWidth: mainApp.width,
    minHeight: mainApp.height,
    maxWidth: mainApp.width,
    maxHeight: mainApp.height,
    title: app.getName(),
    icon: join(__dirname, './icons/icon.ico'),
    show: true,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, './preload.js'),
      // // eslint-disable-next-line no-undef
      // preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
    }
  }
  
  const getPosition = () => {
    const padding = 10
    if (settings.getSync('ontop', false)) {
      const screenSize = screen.getPrimaryDisplay().workAreaSize
      if (mainApp.window) {
        [ mainApp.width, mainApp.height ] = mainApp.window.getSize()
        logger.log('screenSize', screenSize, 'width', mainApp.width, 'height',  mainApp.height)
      }
      return {
        x: screenSize.width - mainApp.width - padding,
        y: screenSize.height - mainApp.height - padding
      }
    } else {
      return settings.getSync('position')
    }
  }

  mainApp.window = new BrowserWindow(Object.assign(mainApp.config, getPosition()))
  mainApp.window.loadURL(mainApp.url)
  mainApp.window.setMenu(null)
  mainApp.window.setSkipTaskbar(settings.getSync('ontop', false))
  mainApp.window.setAlwaysOnTop(settings.getSync('ontop', false))
  mainApp.window.setMovable(!settings.getSync('ontop', false))
  mainApp.window.setMinimizable(false)

  mainApp.window.webContents.openDevTools();

  mainApp.tray = new Tray(join(__dirname, './icons/16x16.png'))
  let hideWindow = false

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Always On Top',
      sublabel: 'and lock window mode.',
      type: 'checkbox',
      checked: settings.getSync('ontop', false),
      click: (menuItem) => {
        settings.set('ontop', menuItem.checked)
        mainApp.window.setAlwaysOnTop(menuItem.checked)
        mainApp.window.setMovable(!menuItem.checked)
        mainApp.window.setSkipTaskbar(menuItem.checked)
        // mainApp.window.set
        const position = getPosition()
        if (position) mainApp.window.setPosition(position.x, position.y)
      }
    },
    { type: 'separator' },
    { label: 'Watch Clipboard', type: 'checkbox', role: 'toggle-clipboard', checked: settings.getSync('clipboard', false), click: onClick },
    { label: 'Auto Download', type: 'checkbox', role: 'auto-dl', visible: false, checked: false, click: onClick },
    { label: 'Exit', role: 'quit' }
  ])

  mainApp.tray.setContextMenu(contextMenu)
  mainApp.tray.setToolTip('Hentai Downloader 2.2.0')
  mainApp.tray.on('click', () => {
    if (hideWindow) {
      mainApp.window.show()
    } else {
      mainApp.window.hide()
    }
  })

  const savePosition = () => {
    let [ x, y ] = mainApp.window.getPosition()
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const [ winWidth, winHeight ] = mainApp.window.getSize()
    if (x < 0) x = 0
    if (x > (width - winWidth)) x = (width - winWidth)
    if (y < 0) y = 0
    if (y > (height - winHeight)) y = (height - winHeight)
    settings.set('position', { x, y })
    logger.log({ x, y })
  }
  let moveId = null
  mainApp.window.on('moved', () => {
    if (settings.getSync('ontop', false)) return
    if (moveId) clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })
  mainApp.window.on('move', () => {
    if (settings.getSync('ontop', false)) return
    if (moveId) clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })

  mainApp.window.on('show', () => {
    hideWindow = !hideWindow
  })

  mainApp.window.on('hide', () => {
    hideWindow = !hideWindow
  })

  mainApp.window.on('closed', () => {
    mainApp.tray.destroy()
    delete mainApp.window
  })

  // initMain(mainApp.window, mainApp.tray)
}

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainApp.tray.destroy()
  }
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
