import { app, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'
import electronUpdater from 'electron-updater'
import log from 'electron-log/main'

const { autoUpdater } = electronUpdater

export function initUpdater(win) {
  if (is.dev || !app.isPackaged) return

  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => log.info('update available:', info.version))
  autoUpdater.on('error', (err) => log.error('update error:', err?.message || err))
  autoUpdater.on('update-downloaded', async (info) => {
    const { response } = await dialog.showMessageBox(win && !win.isDestroyed() ? win : undefined, {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart to apply the update. It will also be installed when you quit.'
    })
    if (response === 0) autoUpdater.quitAndInstall()
  })

  autoUpdater.checkForUpdates().catch((err) => log.error('update check failed:', err?.message))
}
