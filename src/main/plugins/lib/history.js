import settings from 'electron-settings'

const KEY = 'history'
const MAX_ENTRIES = 200

export const getHistory = () => {
  const list = settings.getSync(KEY)
  return Array.isArray(list) ? list : []
}

// Newest first; downloading the same gallery again moves its entry to the top.
export const addHistory = (manga, directory) => {
  const entry = {
    ref: manga.ref,
    url: manga.url,
    name: manga.name,
    page: manga.page,
    language: manga.language,
    size: manga.size,
    directory,
    date: new Date().toISOString()
  }
  const rest = getHistory().filter((h) => h.ref !== entry.ref)
  settings.setSync(KEY, [entry, ...rest].slice(0, MAX_ENTRIES))
}

export const removeHistory = (ref) => {
  settings.setSync(
    KEY,
    getHistory().filter((h) => h.ref !== ref)
  )
}

export const clearHistory = () => settings.unsetSync(KEY)
