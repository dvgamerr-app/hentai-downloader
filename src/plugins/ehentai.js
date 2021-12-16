import { clipboard, powerSaveBlocker } from 'electron'
import URL from 'url-parse'
import fs, { existsSync } from 'fs'
import path from 'path'
import moment from 'moment'
import settings from 'electron-settings'
import axios from 'axios'
import https from 'https'

import cookieSupport from 'axios-cookiejar-support'
import * as cfg from './lib/config'

cookieSupport(axios)

// At request level
const agent = new https.Agent({ rejectUnauthorized: false })

let saveBlockerId = null
let jarCookie = cfg.loadCookie()
let timeClip = null

console.log('cookieSupport:', jarCookie)
export const onWatchClipboard = () => {
  if (settings.get('clipboard', false)) {
    let data = null
    timeClip = setInterval(() => {
      const text = clipboard.readText()
      if (data !== text) {
        console.log('clipboard-watch', text)
        data = text
      }
    }, 300)
  } else if (timeClip) {
    clearInterval(timeClip)
  }
}

const reqHentai = async (link, method, options = {}) => {
  options.headers = Object.assign({
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,th;q=0.8,ja;q=0.7',
    'cache-control': 'no-cache',
    "sec-ch-ua": `" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "Windows",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Connection": "keep-alive",
  }, options.headers)

  wLog(`URL REQUEST: ${link}`)
  await jarCookieBuild()
  return axios(Object.assign({
    url: link,
    method: method || 'GET',
    jar: jarCookie,
    withCredentials: true,
    httpsAgent: agent,
    timeout: 5000
  }, options)).then((res) => {
    return jarCookieCheck().then(() => res)
  }).then((res) => {
    wLog(`URL RESPONSE: ${res.status} body: ${res.data.length}`)
    return res.data
  }).catch((ex) => {
    if (ex.response) {
      console.log('EX.RESPONSE', ex.response)
      const unavailable = /<p>(.*?)<\/p>/ig.exec(ex.response.data)
      return unavailable[1] || unavailable || ex.response.status
    } else {
      console.log('EX', ex)
      return ex.message || ex
    }
  })

  // return new Promise((resolve, reject) => {
  //   wLog(`URL REQUEST: ${link}`)
  //   axios(Object.assign({
  //     url: link,
  //     method: method || 'GET',
  //     jar: jarCookie,
  //     timeout: 5000
  //   }, options), (error, res, body) => {
  //     jarCookieCheck().then(() => {
  //       if (error) {
  //         reject(new Error(error))
  //         return
  //       }
  //       let { statusCode } = res
  //       wLog(`URL RESPONSE: ${statusCode} body: ${body.length}`)
  //       if (statusCode === 302 || statusCode === 200) {
  //         resolve(body)
  //       } else {
  //         reject(new Error(statusCode))
  //       }
  //     })
  //   })
  // })
}

const blockCookie = (path, name, ex = false) => new Promise((resolve, reject) => {
  if (!jarCookie) resolve()

  jarCookie.store.removeCookie(!ex ? 'e-hentai.org' : 'exhentai.org', path, name, (err) => {
    
    if (err) {
      console.error('jarCookie::removeCookie:', err)
      return reject(err)
    }
    resolve()
  })
})

const getCookie = (name, ex = false) => new Promise((resolve, reject) => {
  if (!jarCookie) return resolve(null)

  // console.log('getCookie', name)
  jarCookie.store.findCookie(!ex ? 'e-hentai.org' : 'exhentai.org', '/', name, (err, cookie) => {
    if (err) {
      console.error('jarCookie::findCookie:', err)
      return reject(err)
    }
    resolve(cookie)
  })
})

const pushCookie = (cookie) => new Promise((resolve, reject) => {
  if (!cookie || !jarCookie) return resolve()
  
  jarCookie.store.putCookie(cookie, (err) => {
    if (err) {
      console.error('jarCookie::putCookie:', err)
      return reject(err)
    }
    resolve()
  })
})
export const setCookie = (path, value, domain = 'e-hentai.org') => new Promise((resolve, reject) => {
  if (!jarCookie) return resolve()

  // console.log('setCookie:', value)
  jarCookie.setCookie(`${value}; Path=${path}; Domain=${domain}`, `http://${domain}/`, {}, (err) => {
    if (err) {
      console.error('jarCookie::setCookie:', err)
      return reject(err)
    }
    resolve()
  })
})
const jarCookieBuild = async (ex = false) => {
  let memberId = await getCookie('ipb_member_id')
  if (memberId) {
    const exMemberId = await getCookie('ipb_member_id', true)
    if (!exMemberId) {
      memberId = memberId.clone()
      memberId.domain = 'exhentai.org'
      pushCookie(memberId)
    }
    if (!settings.get('igneous') && ex) {
      throw new Error('Please join your browser session.')
    }
  } else {
    settings.set('config', {})
  }

  let passHash = await getCookie('ipb_pass_hash')
  if (passHash) {
    passHash = passHash.clone()
    passHash.domain = 'exhentai.org'
    pushCookie(passHash)
  }

  if (settings.get('igneous')) {
    await setCookie('/', `igneous=${settings.get('igneous')}`, '.exhentai.org')
    await setCookie('/', `ipb_member_id=${settings.get('ipb_member_id')}`, '.exhentai.org')
    await setCookie('/', `ipb_pass_hash=${settings.get('ipb_pass_hash')}`, '.exhentai.org')
    await setCookie('/', `igneous=${settings.get('igneous')}`, '.e-hentai.org')
    await setCookie('/', `ipb_member_id=${settings.get('ipb_member_id')}`, '.e-hentai.org')
    await setCookie('/', `ipb_pass_hash=${settings.get('ipb_pass_hash')}`, '.e-hentai.org')
  }
}

const jarCookieCheck = async () => {
  await blockCookie('/', 'sk')
  await blockCookie('/', 'sk', true)

  await blockCookie('/s/', 'skipserver')
  await blockCookie('/', 'yay', true)
  cfg.saveCookie(jarCookie)

  // console.group('Cookie Check List')
  // const idx = jarCookie.store.idx
  // if (Object.keys(idx).length > 0) {
  //   for (const domain in idx) {
  //     for (const router in idx[domain]) {
  //       for (const cookie in idx[domain][router]) {
  //         console.log('  -', domain, cookie, ':', idx[domain][router][cookie].value)
  //       }
  //     }
  //   }
  // }
  // console.groupEnd('Cookie Check List')
}
// console.log('development:', touno.DevMode)
const wError = (...msg) => {
  fs.appendFileSync(`./${moment().format('YYYY-MM-DD')}-error.log`, `${moment().format('HH:mm:ss.SSS')} ${msg.join(' ')}\n`)
}
const wLog = (...msg) => {
  fs.appendFileSync(`./${moment().format('YYYY-MM-DD')}.log`, `${moment().format('HH:mm:ss.SSS')} ${msg.join(' ')}\n`)
}

const exHentaiHistory = (uri, data) => {
  return {
    url: uri,
    data: data
  }
}

let getFilename = (index, total) => {
  return `${Math.pow(10, (total.toString().length - index.toString().length) + 1).toString().substr(2, 10) + index}`
}

const getExtension = (res) => {
  switch (res.headers['content-type']) {
    case 'jpg':
    case 'image/jpg':
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
    case 'image/gif': return 'gif'
  }
}
let getImage = async (res, manga, l, index, directory, emit) => {
  let image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
  let nl = /return nl\('(.*?)'\)/ig.exec(res)[1]
  let filename = getFilename(index + 1, manga.page)

  let name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
  let dir = path.join(directory, name)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)

  let nRetry = 0
  let isSuccess = false
  do {
    let resImage = null
    if (nRetry > 0) {
      wLog('Retry::', nRetry)
      let link = manga.items[index]
      manga.items[index] = `${link}${link.indexOf('?') > -1 ? '&' : '?'}nl=${nl}`
      res = await reqHentai(manga.items[index])
      nl = /return nl\('(.*?)'\)/ig.exec(res)[1]
      image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
    }
    emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page) })
    wLog(`Downloading...  -- '${(index + 1)}.jpg' of ${manga.page} files -->`)
    try {
      const response = await axios({
        url: image,
        method: 'GET',
        responseType: 'stream',
        jar: jarCookie,
        withCredentials: true,
        httpsAgent: agent,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9,th;q=0.8,ja;q=0.7',
          'Strict-Transport-Security': 'max-age=15552000; includeSubDomains; preload',
          'referer': `https://${new URL(manga.url).hostname}/`,
          "sec-ch-ua": `" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"`,
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "Windows",
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "cross-site"
        }
      })
      // console.log('response', response)
      isSuccess = true
      resImage = response.data
      // // clearTimeout(cancelTime)
      const extensions = getExtension(response)
      if (extensions) wLog(index + 1, '--> ', response.statusCode, response.headers['content-type'])

      const asyncWriterImage = (timeout = 30) => new Promise((resolve, reject) => {
        let cancelTime = setTimeout(() => {
          writer.close()
          // resImage.close()
          reject(new Error('Operation canceled.'))
        }, timeout * 1000)
        resImage.on('error', ex => {
          clearTimeout(cancelTime)
          writer.close()
          // resImage.close()
          reject(new Error(`Download:: ${ex.toString()}`))
        })
        writer.on('error', (ex) => {
          clearTimeout(cancelTime)
          writer.close()
          // resImage.close()
          reject(new Error(`Writer:: ${ex.toString()}`))
        })

        writer.on('finish', () => {
          clearTimeout(cancelTime)
          writer.close()
          // resImage.close()
          resolve()
        })
      })

      const writer = fs.createWriteStream(`${dir}/${filename}.${extensions}`)
      resImage.pipe(writer)
      await asyncWriterImage()

      let success = parseInt(manga.page) === index + 1
      emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page), finish: success })
      if (success) {
        let config = settings.get('config') || { user_id: 'guest' }
        let items = fs.readdirSync(dir)
        wLog('Complate -- Read', manga.page, 'files, and in directory', items.length, 'files')
        wLog('---------------------')

        exHentaiHistory('exhentai/manga', {
          user_id: config.user_id,
          name: manga.name,
          link: manga.url,
          cover: manga.cover,
          language: manga.language,
          size: manga.size,
          page: manga.page,
          completed: true
        })
      }
    } catch (ex) {
      nRetry++
      wLog('getImage::', manga.items[index])
      wError('getImage::', index, ex.message)
      wError('getImage::', index, ex.stack)
    } finally {
      wLog('getImage::', manga.items[index])
    }
  } while (nRetry < 3 && !isSuccess)

}

export const download = async (list, directory, emit) => {
  const delay = (timeout = 1000) => new Promise(resolve => {
    const id = setTimeout(() => {
      clearTimeout(id)
      resolve()
    }, timeout)
  })

  saveBlockerId = powerSaveBlocker.start('prevent-display-sleep')
  let imgTotal = 0
  try {
    let iManga = 0
    for await (const manga of list) {
      if (manga.error) continue

      let iImage = 0
      for await (const imageUrl of manga.items) {
        const filename = getFilename(iImage + 1, manga.page)
        const name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
        const exisFile = ext => existsSync(`${path.join(directory, name)}/${filename}.${ext}`)
        if (!exisFile('jpg') && !exisFile('png') && !exisFile('gif')) {
          let res = await reqHentai(imageUrl)
          await getImage(res, manga, iManga, iImage, directory, emit)
        } else {
          await delay(100)
          emit.send('DOWNLOAD_WATCH', { index: iManga, current: filename, total: parseInt(manga.page), finish: parseInt(manga.page) === iImage + 1 })
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
    if (powerSaveBlocker.isStarted(saveBlockerId)) powerSaveBlocker.stop(saveBlockerId)
    saveBlockerId = null
  }

  // for (let l = 0; l < list.length; l++) {
  //   let manga = list[l]
  //   if (manga.error) continue
  //   for (let i = 0; i < manga.items.length; i++) {
  //     let filename = getFilename(i + 1, manga.page)
  //     let name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
  //     let dir = path.join(directory, name)
  //     if (!fs.existsSync(`${dir}/${filename}.jpg`) && !fs.existsSync(`${dir}/${filename}.png`) && !fs.existsSync(`${dir}/${filename}.gif`)) {
  //       all.push(() => new Promise(async (resolve, reject) => {
  //         await jarCookieBuild()
  //         let res = await request(manga.items[i], { jar: jarCookie })
  //         await jarCookieCheck()
  //         await getImage(res, manga, l, i, resolve, directory, emit)
  //       }))
  //     } else {
  //       emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page), finish: parseInt(manga.page) === i + 1 })
  //     }
  //   }
  // }
}

const validateURL = (link) => {
  const baseUrl = new URL(link.trim())
  if (!/\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.test(baseUrl.pathname)) {
    throw new Error(`Key missing, or incorrect key provided.`)
  } else {
    let [fixed] = /\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(baseUrl.pathname)
    return `https://${baseUrl.hostname}${fixed}`
  }
}

let getManga = async (link, raw, emit) => {
  const baseUrl = new URL(link)
  let [fixed] = /\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(baseUrl.pathname)

  let name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(raw)
  let language = /Language:.*?class="gdt2">(.*?)&/ig.exec(raw)
  let size = /File Size:.*?class="gdt2">(.*?)</ig.exec(raw)
  let length = /Length:.*?gdt2">(.*?).page/ig.exec(raw)
  let cover = /<div id="gleft">.*?url\((.*?)\)/ig.exec(raw)

  if (!name) throw new Error('manga.name is not found')
  if (!language) throw new Error('manga.language is not found')
  if (!size) throw new Error('manga.size is not found')
  if (!length) throw new Error('manga.page is not found')
  if (!cover) throw new Error('manga.page is not found')

  let manga = {
    ref: fixed,
    url: link,
    name: name[1],
    cover: cover[1],
    language: (language[1] || '').trim(),
    size: size[1],
    page: length[1],
    items: []
  }
  const fetchImage = (manga, raw) => {
    for (const gdt of raw.match(/(gdtm|gdtl)".*?<a href="(.*?)">/ig)) {
      manga.items.push(/(gdtm|gdtl)".*?<a href="(.*?)">/i.exec(gdt)[2])
    }
  }
  // slack(baseUrl.host, manga)
  fetchImage(manga, raw)

  console.log('------- manga -------')
  console.dir(manga)
  let config = settings.get('config') || { user_id: 'guest' }
  console.log('------- config -------')
  console.dir(config)
  exHentaiHistory('exhentai/manga', Object.assign(manga, {
    user_id: config.user_id
  }))

  const totalPage = Math.ceil(manga.page / manga.items.length)
  emit.send('INIT_MANGA', { page: 1, total: totalPage })

  console.log('Recheck NextPage:', manga.items.length, manga.page)
  if (manga.items.length !== manga.page) {
    for (let i = 1; i < totalPage; i++) {
      emit.send('INIT_MANGA', { page: i + 1, total: totalPage })
      raw = await reqHentai(`${link}?p=${i}`)
      fetchImage(manga, raw)
    }
    if (manga.items.length !== parseInt(manga.page)) throw new Error(`manga.items is '${manga.items.length}' and length is '${manga.page}'`)
    return manga
  } else {
    return manga
  }
}

export function parseHentai (link, emit) {
  return (async () => {
    link = validateURL(link)
    console.log('validateURL', link)
    let memberId = await getCookie('igneous')
    if (memberId && !await getCookie('nw')) {
      console.log('nw')
      await setCookie('/', 'nw=1')
      await setCookie('/', 'nw=1', 'exhentai.org')
    }

    console.log('reqHentai', link)
    const hostname = new URL(link).hostname
    let res = await reqHentai(link, 'GET', {
      headers: {
        'pragma': 'no-cache',
        'referer': `https://${hostname}/`
      }
    })
    if (!/DOCTYPE.html.PUBLIC/ig.test(res)) throw new Error(res)
    let warnMe = /<a href="(.*?)">Never Warn Me Again/ig.exec(res)
    if (warnMe) throw new Error('Never Warn Me Again')
    console.log('getManga')
    return getManga(link, res, emit)
  })().catch(ex => {
    if (ex.response) {
      const res = ex.response.toJSON()
      console.log('Error:', res)
      const baseUrl = new URL(link.trim())
      wLog(`This gallery has been removed: https://${baseUrl.hostname}${baseUrl.pathname}`)
      throw new Error('This gallery has been removed or is unavailable.')
    } else {
      wError(`*error*: ${link}\n${ex.toString()}`)
      throw ex
    }
  })
}

export async function login (username, password) {
  let res1 = await reqHentai('https://forums.e-hentai.org/index.php?act=Login&CODE=01', 'POST', {
    header: { 'referer': 'https://forums.e-hentai.org/index.php' },
    form: {
      referer: 'https://forums.e-hentai.org/index.php',
      CookieDate: 1,
      b: 'd',
      bt: '1-1',
      UserName: username.trim(),
      PassWord: password.trim(),
      ipb_login_submit: 'Login!'
    },
    resolveWithFullResponse: true
  })
  return res1
}

export const cookie = getCookie
export const reload = jarCookieCheck
