import { app, BrowserWindow, Tray, Menu, shell, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import settings from 'electron-settings'
import log from 'electron-log/main'
import icon from '../../resources/256x256.png?asset'
import icoTray from '../../resources/16x16.png?asset'
const { name } = '../../package.json?asset'

// Optional, initialize the log for any renderer process
log.initialize()

const onClick = (e) => {
  console.log(e)
}

settings.configure({ fileName: `${name}.json`, prettify: true })
log.log('settings-loaded', settings.SettingsObject)
log.log('env:', process.env.NODE_ENV)
log.log('App:', app.getName())

const mainApp = {
  url: `file://${__dirname}/index.html`,
  // // eslint-disable-next-line no-undef
  // url: MAIN_WINDOW_WEBPACK_ENTRY,
  win: null,
  tray: null,
  config: {},
  width: 600,
  height: 380
}

function createWindow() {
  mainApp.config = {
    width: mainApp.width,
    height: mainApp.height,
    minWidth: mainApp.width,
    minHeight: mainApp.height,
    maxWidth: mainApp.width,
    maxHeight: mainApp.height,
    title: app.getName(),
    show: true,
    movable: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    transparent: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  }

  const getPosition = () => {
    const padding = 10
    if (settings.getSync('ontop', false)) {
      const screenSize = screen.getPrimaryDisplay().workAreaSize
      if (mainApp.win) {
        ;[mainApp.width, mainApp.height] = mainApp.win.getSize()
        log.log('screenSize', screenSize, 'width', mainApp.width, 'height', mainApp.height)
      }
      return {
        x: screenSize.width - mainApp.width - padding,
        y: screenSize.height - mainApp.height - padding
      }
    } else {
      return settings.getSync('position')
    }
  }

  mainApp.win = new BrowserWindow(Object.assign(mainApp.config, getPosition()))
  mainApp.win.loadURL(mainApp.url)
  mainApp.win.setMenu(null)
  mainApp.win.setSkipTaskbar(settings.getSync('ontop', false))
  mainApp.win.setAlwaysOnTop(settings.getSync('ontop', false))
  mainApp.win.setMovable(!settings.getSync('ontop', false))
  mainApp.win.setMinimizable(false)

  mainApp.tray = new Tray(icoTray)
  let hideWindow = false

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Always On Top',
      sublabel: 'and lock window mode.',
      type: 'checkbox',
      checked: settings.getSync('ontop', false),
      click: (menuItem) => {
        settings.set('ontop', menuItem.checked)
        mainApp.win.setAlwaysOnTop(menuItem.checked)
        mainApp.win.setMovable(!menuItem.checked)
        mainApp.win.setSkipTaskbar(menuItem.checked)
        // mainApp.win.set
        const position = getPosition()
        if (position) mainApp.win.setPosition(position.x, position.y)
      }
    },
    { type: 'separator' },
    {
      label: 'Watch Clipboard',
      type: 'checkbox',
      role: 'toggle-clipboard',
      checked: settings.getSync('clipboard', false),
      click: onClick
    },
    {
      label: 'Auto Download',
      type: 'checkbox',
      role: 'auto-dl',
      visible: false,
      checked: false,
      click: onClick
    },
    { label: 'Exit', role: 'quit' }
  ])

  mainApp.tray.setContextMenu(contextMenu)
  mainApp.tray.setToolTip('Hentai Downloader 2.2.0')
  mainApp.tray.on('click', () => {
    if (hideWindow) {
      mainApp.win.show()
    } else {
      mainApp.win.hide()
    }
  })

  const savePosition = () => {
    let [x, y] = mainApp.win.getPosition()
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const [winWidth, winHeight] = mainApp.win.getSize()
    if (x < 0) x = 0
    if (x > width - winWidth) x = width - winWidth
    if (y < 0) y = 0
    if (y > height - winHeight) y = height - winHeight
    settings.set('position', { x, y })
    log.log({ x, y })
  }
  let moveId = null
  mainApp.win.on('moved', () => {
    if (settings.getSync('ontop', false)) return
    if (moveId) clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })
  mainApp.win.on('move', () => {
    if (settings.getSync('ontop', false)) return
    if (moveId) clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })

  mainApp.win.on('show', () => {
    hideWindow = !hideWindow
  })

  mainApp.win.on('hide', () => {
    hideWindow = !hideWindow
  })

  mainApp.win.on('closed', () => {
    mainApp.tray.destroy()
    delete mainApp.win
  })

  mainApp.win.on('ready-to-show', () => {
    mainApp.win.show()
  })

  mainApp.win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainApp.win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainApp.win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainApp.tray.destroy()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
