import { app, powerSaveBlocker } from 'electron'
import fs, { existsSync } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import dayjs from 'dayjs'
import settings from 'electron-settings'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'

const DEFAULT_HEADERS = {
  'user-agent': USER_AGENT,
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,application/signed-exchange;v=b3;q=0.7,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'upgrade-insecure-requests': '1',
  'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="99", "Google Chrome";v="152"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-user': '?1'
}
const GALLERY_PATH_PATTERN = /\/\w\/\d{1,8}\/[0-9a-f]+\//i
const IMAGE_EXTENSIONS = ['jpg', 'png', 'gif']
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

let cancelDownload = false
let saveBlockerId = null

const logDir = () => app.getPath('userData')

const appendLog = (suffix, msg) => {
  const now = dayjs()
  fs.appendFileSync(
    path.join(logDir(), `${now.format('YYYY-MM-DD')}${suffix}.log`),
    `${now.format('HH:mm:ss.SSS')} ${msg.join(' ')}\n`
  )
}

const wError = (...msg) => appendLog('-error', msg)
const wLog = (...msg) => appendLog('', msg)

const buildCookieHeader = (hostname) => {
  const igneous = settings.getSync('igneous')
  if (hostname === 'exhentai.org' && !igneous) {
    throw new Error('Please join your browser session.')
  }
  const cookies = ['nw=1']
  if (igneous) {
    cookies.push(`igneous=${igneous}`)
    cookies.push(`ipb_member_id=${settings.getSync('ipb_member_id')}`)
    cookies.push(`ipb_pass_hash=${settings.getSync('ipb_pass_hash')}`)
  }
  return cookies.join('; ')
}

const reqHentai = async (link, options = {}) => {
  const { hostname } = new URL(link)
  wLog(`URL REQUEST: ${link}`)
  let res
  try {
    res = await fetch(link, {
      method: options.method || 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        cookie: buildCookieHeader(hostname),
        referer: `https://${hostname}/`,
        ...options.headers
      },
      signal: options.signal || AbortSignal.timeout(30_000)
    })
  } catch (ex) {
    const msg = ex.name === 'TimeoutError' ? `Request timed out: ${link}` : ex.message
    wError(`URL ERROR: ${msg}`)
    throw new Error(msg)
  }
  if (!res.ok) {
    const text = await res.text()
    const match = /<p>(.*?)<\/p>/i.exec(text)
    const msg = match?.[1] || `HTTP ${res.status}`
    wLog(`URL ERROR: ${res.status} ${msg}`)
    throw new Error(msg)
  }
  const text = await res.text()
  wLog(`URL RESPONSE: ${res.status} body: ${text.length}`)
  return text
}

const getExtension = (contentType = '') => {
  if (/jpeg|jpg/.test(contentType)) return 'jpg'
  if (/png/.test(contentType)) return 'png'
  if (/gif/.test(contentType)) return 'gif'
  return 'jpg'
}

const getFilename = (index, total) =>
  `${Math.pow(10, total.toString().length - index.toString().length + 1)
    .toString()
    .slice(2)}${index}`

const getImage = async (res, manga, listIndex, imageIndex, dir, emit) => {
  let imageUrl = /id="img".*?src="(.*?)"/i.exec(res)?.[1]
  let nl = /return nl\('(.*?)'\)/i.exec(res)?.[1]
  const filename = getFilename(imageIndex + 1, manga.page)
  const pageTotal = Number.parseInt(manga.page, 10)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const { hostname } = new URL(manga.url)
  const cookieStr = buildCookieHeader(hostname)

  let nRetry = 0
  let isSuccess = false

  do {
    if (cancelDownload) throw new Error('User Cancel Request by button.')
    if (nRetry > 0) {
      wLog('Retry::', nRetry)
      const sep = manga.items[imageIndex].includes('?') ? '&' : '?'
      manga.items[imageIndex] = `${manga.items[imageIndex]}${sep}nl=${nl}`
      const retryPage = await reqHentai(manga.items[imageIndex])
      nl = /return nl\('(.*?)'\)/i.exec(retryPage)?.[1]
      imageUrl = /id="img".*?src="(.*?)"/i.exec(retryPage)?.[1]
    }

    emit.send('DOWNLOAD_WATCH', {
      index: listIndex,
      current: filename,
      total: pageTotal
    })
    wLog(`Downloading... '${imageIndex + 1}' of ${manga.page} files`)

    try {
      const imgRes = await fetch(imageUrl, {
        headers: {
          'user-agent': USER_AGENT,
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
          cookie: cookieStr,
          referer: `https://${hostname}/`,
          'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="99", "Google Chrome";v="152"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'image',
          'sec-fetch-mode': 'no-cors',
          'sec-fetch-site': 'cross-site'
        },
        signal: AbortSignal.timeout(30_000)
      })
      if (!imgRes.ok) throw new Error(`Image HTTP ${imgRes.status}`)

      const ext = getExtension(imgRes.headers.get('content-type'))
      const filePath = `${dir}/${filename}.${ext}`
      const writer = fs.createWriteStream(filePath)
      await pipeline(Readable.fromWeb(imgRes.body), writer)

      isSuccess = true
      const finished = pageTotal === imageIndex + 1
      emit.send('DOWNLOAD_WATCH', {
        index: listIndex,
        current: filename,
        total: pageTotal,
        finish: finished
      })

      if (finished) {
        const items = fs.readdirSync(dir)
        wLog(`Complete -- Read ${manga.page} files, directory has ${items.length} files`)
        wLog('---------------------')
      }
    } catch (ex) {
      nRetry++
      wLog('getImage::', manga.items[imageIndex])
      wError('getImage::', imageIndex, ex.message)
    }
  } while (nRetry < 3 && !isSuccess)
}

export const cancel = () => {
  cancelDownload = true
}

export const download = async (list, directory, emit) => {
  cancelDownload = false

  saveBlockerId = powerSaveBlocker.start('prevent-display-sleep')
  let imgTotal = 0
  try {
    let iManga = 0
    for (const manga of list) {
      if (cancelDownload) throw new Error('User Cancel Request by button.')
      if (manga.error) continue

      const pageTotal = Number.parseInt(manga.page, 10)
      const safeName = manga.name.replace(/[/\\|.:?<>"]/g, '')
      const mangaDir = path.join(directory, safeName)
      let iImage = 0
      for (const imageUrl of manga.items) {
        const filename = getFilename(iImage + 1, manga.page)
        const exists = IMAGE_EXTENSIONS.some((ext) =>
          existsSync(path.join(mangaDir, `${filename}.${ext}`))
        )

        if (!exists) {
          const res = await reqHentai(imageUrl)
          await getImage(res, manga, iManga, iImage, mangaDir, emit)
        } else {
          await delay()
          emit.send('DOWNLOAD_WATCH', {
            index: iManga,
            current: filename,
            total: pageTotal,
            finish: pageTotal === iImage + 1
          })
        }
        iImage++
        imgTotal++
      }
      iManga++
    }
  } catch (ex) {
    wError(`*error*: ${ex.toString()}`)
  } finally {
    wLog('hentai-downloader', `*downloading request* \`${imgTotal}\` time`)
    if (saveBlockerId !== null && powerSaveBlocker.isStarted(saveBlockerId)) {
      powerSaveBlocker.stop(saveBlockerId)
    }
    saveBlockerId = null
  }
}

const validateURL = (link) => {
  const base = new URL(link.trim())
  const [fixed] = GALLERY_PATH_PATTERN.exec(base.pathname) ?? []
  if (!fixed) {
    throw new Error('Key missing, or incorrect key provided.')
  }
  return `https://${base.hostname}${fixed}`
}

const getManga = async (link, raw, emit) => {
  const base = new URL(link)
  const [fixed] = GALLERY_PATH_PATTERN.exec(base.pathname)

  const name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/is.exec(raw)
  const language = /Language:.*?class="gdt2">(.*?)&/is.exec(raw)
  const size = /File Size:.*?class="gdt2">(.*?)</is.exec(raw)
  const length = /Length:.*?gdt2">(.*?).page/is.exec(raw)
  const cover = /<div id="gleft">.*?url\((.*?)\)/is.exec(raw)

  if (!name) throw new Error('manga.name is not found')
  if (!language) throw new Error('manga.language is not found')
  if (!size) throw new Error('manga.size is not found')
  if (!length) throw new Error('manga.page is not found')
  if (!cover) throw new Error('manga.cover is not found')

  const manga = {
    ref: fixed,
    url: link,
    name: name[1],
    cover: cover[1],
    language: (language[1] || '').trim(),
    size: size[1],
    page: length[1],
    items: []
  }

  const fetchImageLinks = (src) => {
    const gdtMatch = /<div id="gdt"[^>]*>([\s\S]*?)<div class="gtb">/i.exec(src)
    if (!gdtMatch) return
    for (const match of gdtMatch[1].matchAll(/<a href="([^"]+)">/g)) {
      manga.items.push(match[1])
    }
  }

  fetchImageLinks(raw)

  if (manga.items.length === 0) throw new Error('manga.items is empty, page parsing failed')

  const pageCount = Number.parseInt(manga.page, 10)
  const totalPage = Math.ceil(pageCount / manga.items.length)
  emit.send('INIT_MANGA', { page: 1, total: totalPage })

  if (manga.items.length !== pageCount) {
    for (let i = 1; i < totalPage; i++) {
      emit.send('INIT_MANGA', { page: i + 1, total: totalPage })
      const nextRaw = await reqHentai(`${link}?p=${i}`)
      fetchImageLinks(nextRaw)
    }
    if (manga.items.length !== pageCount) {
      throw new Error(`manga.items is '${manga.items.length}' and length is '${manga.page}'`)
    }
  }

  return manga
}

export async function parseHentai(link, emit) {
  cancelDownload = false
  try {
    link = validateURL(link)
    const { hostname } = new URL(link)
    const res = await reqHentai(link, {
      headers: { pragma: 'no-cache', referer: `https://${hostname}/` }
    })
    if (!/<!DOCTYPE html/i.test(res)) throw new Error(res)
    if (/<a href="(.*?)">Never Warn Me Again/i.test(res)) throw new Error('Never Warn Me Again')
    return await getManga(link, res, emit)
  } catch (ex) {
    wError(`*error*: ${link}\n${ex.toString()}`)
    throw ex
  }
}
