'use strict'
const URL = require('url-parse')
const fs = require('fs')
const path = require('path')
const async = require('async-q')
const xhr = require('request')
const moment = require('moment')
const settings = require('electron-settings')
const request = require('request-promise')
const events = require('events')
const em = new events.EventEmitter()
const { powerSaveBlocker } = require('electron')
const cfg = require('./lib/config')

let saveBlockerId = null
const blockCookie = (path, name, ex = false) => new Promise((resolve, reject) => {
  const jar = jarCookie._jar
  if (jar && jar.store) {
    jar.store.removeCookie(!ex ? 'e-hentai.org' : 'exhentai.org', path, name, (err) => {
      if (err) reject(err)
      resolve()
    })
  } else {
    resolve()
  }
})

const getCookie = (name, ex = false) => new Promise((resolve, reject) => {
  const jar = jarCookie._jar
  if (jar && jar.store) {
    jar.store.findCookie(!ex ? 'e-hentai.org' : 'exhentai.org', '/', name, (err, cookie) => {
      if (err) reject(err)
      resolve(cookie)
    })
  } else {
    resolve(null)
  }
})

const pushCookie = (cookie) => new Promise((resolve, reject) => {
  const jar = jarCookie._jar
  if (cookie && jar && jar.store) {
    jar.store.putCookie(cookie, (err) => {
      if (err) reject(err)
      resolve()
    })
  } else {
    resolve()
  }
})

const jarCookieCheck = async () => {
  const jar = jarCookie._jar
  await blockCookie('/s/', 'skipserver')

  if (await getCookie('ipb_member_id')) {
    const userId = await getCookie('ipb_member_id', true)
    if (!userId) {
      let memberId = await getCookie('ipb_member_id')
      let passHash = await getCookie('ipb_pass_hash')
      let sk = await getCookie('sk')

      memberId = memberId.clone()
      passHash = passHash.clone()

      memberId.domain = 'exhentai.org'
      passHash.domain = 'exhentai.org'
      sk.domain = 'exhentai.org'

      pushCookie(memberId)
      pushCookie(passHash)
      pushCookie(sk)
    }
  }

  cfg.saveCookie(jar)
  jarCookie._jar = cfg.loadCookie()
  console.log(jarCookie._jar.store)
}
const defaultJar = cfg.loadCookie()
let jarCookie = request.jar()
if (defaultJar) jarCookie._jar = defaultJar
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

let getImage = (res, manga, l, index, resolve, directory, emit) => {
  let image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
  let nl = /return nl\('(.*?)'\)/ig.exec(res)[1]
  let filename = getFilename(index + 1, manga.page)

  let name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
  let dir = path.join(directory, name)

  emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page) })
  let msg = `Downloading...  -- '${(index + 1)}.jpg' of ${manga.page} files -->`
  wLog(msg)

  let req = xhr({
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
      'referer': 'https://e-hentai.org/'
    },
    jar: jarCookie,
    url: image,
    timeout: 5000
  })
  req.on('response', async response => {
    if (response.statusCode === 200) {
      let extensions = null
      switch (response.headers['content-type']) {
        case 'jpg':
        case 'image/jpg':
        case 'image/jpeg':
          extensions = 'jpg'
          break
        case 'image/png':
          extensions = 'png'
          break
        case 'image/gif':
          extensions = 'gif'
          break
      }
      if (extensions) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir)
        let fsStream = fs.createWriteStream(`${dir}/${filename}.${extensions}`)
        req.pipe(fsStream)
        fsStream.on('error', (ex) => {
          wError(`${dir}/${filename}.${extensions}`)
          wError(ex)
          resolve()
          fsStream.close()
        })

        fsStream.on('finish', () => {
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
          resolve()
          fsStream.close()
        })
      } else {
        wLog(index + 1, '--> ', response.statusCode, response.headers['content-type'])
        resolve()
      }
    } else {
      wLog(index + 1, '--> ', response.statusCode, response.headers['content-type'])
      resolve()
    }
  })
  req.on('error', async ex => {
    let link = manga.items[index]
    wError(link, ex.message)
    wError(link, ex.stack)
    wLog('Retry::')
    let nRetry = 0
    let isSuccess = false
    do {
      try {
        manga.items[index] = `${link}${link.indexOf('?') > -1 ? '&' : '?'}nl=${nl}`
        const res = await request({ url: manga.items[index], jar: jarCookie })
        await jarCookieCheck()
        nl = /return nl\('(.*?)'\)/ig.exec(res)[1]
        await getImage(res, manga, l, index, resolve, directory, emit)
        isSuccess = true
      } catch (ex) {
        nRetry++
        wError(manga.items[index], ex.message)
        wError(manga.items[index], ex.stack)
        wLog('Retry::', manga.items[index])
      }
    } while (nRetry < 3 && !isSuccess)
  })
}
em.download = (list, directory, emit) => {
  saveBlockerId = powerSaveBlocker.start('prevent-display-sleep')

  let all = []
  for (let l = 0; l < list.length; l++) {
    let manga = list[l]
    if (manga.error) continue
    for (let i = 0; i < manga.items.length; i++) {
      let filename = getFilename(i + 1, manga.page)
      let name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
      let dir = path.join(directory, name)
      if (!fs.existsSync(`${dir}/${filename}.jpg`) && !fs.existsSync(`${dir}/${filename}.png`) && !fs.existsSync(`${dir}/${filename}.gif`)) {
        all.push(() => new Promise(async (resolve, reject) => {
          let res = await request(manga.items[i], { jar: jarCookie })
          await jarCookieCheck()
          await getImage(res, manga, l, i, resolve, directory, emit)
        }))
      } else {
        emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page), finish: parseInt(manga.page) === i + 1 })
      }
    }
  }

  wLog('hentai-downloader', `*downloading request* \`${all.length}\` time`)
  return async.series(all).then(() => {
    if (powerSaveBlocker.isStarted(saveBlockerId)) powerSaveBlocker.stop(saveBlockerId)
    saveBlockerId = null
  }).catch(ex => {
    if (powerSaveBlocker.isStarted(saveBlockerId)) powerSaveBlocker.stop(saveBlockerId)
    saveBlockerId = null
  })
}

export const emiter = em
export function init (link, emit) {
  let baseUrl = new URL(link.trim())

  let getImage = (manga, data) => {
    let links = data.match(/gdtm".*?<a href="(.*?)">/ig)
    for (var i = 0; i < links.length; i++) {
      let link = /gdtm".*?<a href="(.*?)">/i.exec(links[i])[1]
      manga.items.push(link)
    }
  }

  let getManga = res => {
    let fixed = /\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(baseUrl.pathname)
    if (fixed) link = `https://${baseUrl.hostname}${fixed[0]}`

    let name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(res)
    let language = /Language:.*?class="gdt2">(.*?)&/ig.exec(res)
    let size = /File Size:.*?class="gdt2">(.*?)</ig.exec(res)
    let length = /Length:.*?gdt2">(.*?).page/ig.exec(res)
    let cover = /<div id="gleft">.*?url\((.*?)\)/ig.exec(res)

    if (!name) throw new Error('manga.name is not found')
    if (!language) throw new Error('manga.language is not found')
    if (!size) throw new Error('manga.size is not found')
    if (!length) throw new Error('manga.page is not found')
    if (!cover) throw new Error('manga.page is not found')

    let manga = {
      ref: fixed[0],
      url: link,
      name: name[1],
      cover: cover[1],
      language: language[1],
      size: size[1],
      page: length[1],
      items: []
    }
    let config = settings.get('config') || { user_id: 'guest' }
    // console.log(config)
    exHentaiHistory('exhentai/manga', {
      user_id: config.user_id,
      name: manga.name,
      link: manga.url,
      cover: manga.cover,
      language: manga.language,
      size: manga.size,
      page: manga.page
    })
    // slack(baseUrl.host, manga)
    getImage(manga, res)
    let totalPage = Math.ceil(manga.page / manga.items.length)
    emit.send('INIT_MANGA', { page: 1, total: totalPage })
    if (manga.items.length !== manga.page) {
      let all = []
      for (let i = 1; i < totalPage; i++) {
        all.push(() => {
          emit.send('INIT_MANGA', { page: i + 1, total: totalPage })
          return request(`${link}?p=${i}`, { jar: jarCookie }).then(async (res) => {
            await jarCookieCheck()
            return getImage(manga, res)
          })
        })
      }
      return async.series(all).then(() => {
        // request({
        //   url: link,
        //   jar: jarCookie,
        //   header: {
        //     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
        //     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        //     'accept-language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
        //     'cache-control': 'no-cache',
        //     'pragma': 'no-cache',
        //     'referer': `https://${baseUrl.hostname}/`,
        //     'upgrade-insecure-requests': '1'
        //   }
        // })
        if (manga.items.length !== parseInt(manga.page)) throw new Error(`manga.items is '${manga.items.length}' and length is '${manga.page}'`)
        return manga
      })
    } else {
      return manga
    }
  }

  let reqHentai = async (uri, method, options) => new Promise((resolve, reject) => {
    options = Object.assign({
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      ':authority': 'e-hentai.org',
      ':scheme': 'https',
      'referer': `https://${baseUrl.hostname}/`,
      'upgrade-insecure-requests': '1'
    }, options || {})

    wLog(`URL REQUEST: ${uri}`)
    xhr({
      url: uri,
      method: method || 'GET',
      header: options,
      jar: jarCookie,
      // strictSSL: true,
      // agentOptions: {
      //   passphrase: 'dvg7po8ai',
      //   key: fs.readFileSync(path.join(__dirname, 'cert/key.pem')),
      //   cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem'))
      // },
      timeout: 5000
    }, async (error, res, body) => {
      await jarCookieCheck()
      if (error) {
        reject(new Error(error))
        return
      }
      let { statusCode } = res
      wLog(`URL RESPONSE: ${statusCode}`)
      console.log('error', error)
      console.log('body', body.length)
      if (statusCode === 302 || statusCode === 200) {
        resolve(body)
      } else {
        reject(new Error(statusCode))
      }
    })
  })

  return (async () => {
    if (!/\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.test(baseUrl.pathname)) {
      throw new Error(`Key missing, or incorrect key provided.`)
    } else {
      let fixed = /\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(baseUrl.pathname)
      const userId = await getCookie('ipb_member_id')
      console.log('recheck', userId)
      // if (baseUrl.hostname === 'exhentai.org' && !userId) baseUrl.hostname = 'e-hentai.org'
      link = `https://${baseUrl.hostname}${fixed[0]}`
    }
    let res = await reqHentai(link)
    if (!/DOCTYPE.html.PUBLIC/ig.test(res)) throw new Error(res)
    let warnMe = /<a href="(.*?)">Never Warn Me Again/ig.exec(res)
    if (warnMe) {
      throw new Error('Never Warn Me Again')
      // res = await reqHentai(warnMe[1], 'GET', {
      //   'referer': link
      // })
    }
    return getManga(res)
  })().catch(ex => {
    if (ex.statusCode === 404) {
      if (ex.error) {
        wLog(`*rare*: https://${baseUrl.hostname}${baseUrl.pathname}`)
        throw new Error('This gallery has been removed or is unavailable.')
      } else {
        wError(`*error*: ${link}\n${ex.name.toString()}`)
        throw new Error(ex.name)
      }
    } else {
      wError(`*error*: ${link}\n${ex.toString()}`)
      throw ex
    }
  })
}

let httpHeader = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
  'cache-control': 'no-cache',
  'upgrade-insecure-requests': '1'
}

export async function login (username, password) {
  let res1 = await request({
    url: `https://forums.e-hentai.org/index.php?act=Login&CODE=01`,
    method: 'POST',
    header: Object.assign(httpHeader, {
      'referer': 'https://forums.e-hentai.org/index.php'
    }),
    jar: jarCookie,
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
  await jarCookieCheck()
  return res1
}

export const cookie = getCookie
