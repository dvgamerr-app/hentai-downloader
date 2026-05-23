import { app, BrowserWindow, Tray, Menu, shell, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import settings from 'electron-settings'
import log from 'electron-log/main'
import icon from '../../resources/256x256.png?asset'
import icoTray from '../../resources/16x16.png?asset'
import { initMain, onClick } from './plugins/events.js'

log.initialize()
log.log('env:', process.env.NODE_ENV)

const mainApp = {
  win: null,
  tray: null,
  width: 600,
  height: 380
}

function createWindow() {
  const winConfig = {
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
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      const [winW, winH] = mainApp.win ? mainApp.win.getSize() : [mainApp.width, mainApp.height]
      return { x: width - winW - padding, y: height - winH - padding }
    }
    return settings.getSync('position') || {}
  }

  mainApp.win = new BrowserWindow(Object.assign(winConfig, getPosition()))
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
        settings.setSync('ontop', menuItem.checked)
        mainApp.win.setAlwaysOnTop(menuItem.checked)
        mainApp.win.setMovable(!menuItem.checked)
        mainApp.win.setSkipTaskbar(menuItem.checked)
        const pos = getPosition()
        if (pos?.x != null) mainApp.win.setPosition(pos.x, pos.y)
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
  mainApp.tray.setToolTip(`${app.getName()} ${app.getVersion()}`)
  mainApp.tray.on('click', () => {
    hideWindow ? mainApp.win.show() : mainApp.win.hide()
  })

  let moveId = null
  const savePosition = () => {
    let [x, y] = mainApp.win.getPosition()
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    const [winW, winH] = mainApp.win.getSize()
    x = Math.max(0, Math.min(x, width - winW))
    y = Math.max(0, Math.min(y, height - winH))
    settings.setSync('position', { x, y })
    log.log('position saved:', { x, y })
  }

  mainApp.win.on('moved', () => {
    if (settings.getSync('ontop', false)) return
    clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })
  mainApp.win.on('move', () => {
    if (settings.getSync('ontop', false)) return
    clearTimeout(moveId)
    moveId = setTimeout(savePosition, 200)
  })

  mainApp.win.on('show', () => { hideWindow = false })
  mainApp.win.on('hide', () => { hideWindow = true })

  mainApp.win.on('closed', () => {
    mainApp.tray.destroy()
    mainApp.win = null
  })

  mainApp.win.on('ready-to-show', () => mainApp.win.show())

  mainApp.win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainApp.win.webContents.on('console-message', (_, level, message, line, sourceId) => {
    const src = sourceId ? `${sourceId}:${line}` : ''
    if (level === 3) log.error(`[renderer] ${message}${src ? ' ' + src : ''}`)
    else if (level === 2) log.warn(`[renderer] ${message}${src ? ' ' + src : ''}`)
    else log.log(`[renderer] ${message}${src ? ' ' + src : ''}`)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainApp.win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainApp.win.webContents.once('did-finish-load', () => {
      mainApp.win.webContents.openDevTools({ mode: 'detach' })
    })
  } else {
    mainApp.win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  initMain(mainApp.win)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mainApp.tray?.destroy()
    app.quit()
  }
})
