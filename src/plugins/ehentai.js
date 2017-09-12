'use strict'
import { slack, logs } from './slack.js'

const URL = require('url-parse')
const fs = require('fs')
const path = require('path')
const async = require('async-q')
const Q = require('q')
const xhr = require('request')
// const settings = require('electron-settings')
const request = require('request-promise')
const events = require('events')
const em = new events.EventEmitter()

let getFilename = (index, total) => {
  return `${Math.pow(10, (total.toString().length - index.toString().length) + 1).toString().substr(2, 10) + index}`
}

let getImage = (res, manga, l, index, def, directory, emit) => {
  let image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
  let nl = /return nl\('(.*?)'\)/ig.exec(res)[1]
  let filename = getFilename(index + 1, manga.page)

  emit.send('DOWNLOAD_WATCH', { index: l, status: `${filename} of ${manga.page}`, finish: false })
  // let msg = `Downloading...  -- '${(index + 1)}.jpg' of ${manga.page} files -->`
  // process.stdout.clearLine()
  // process.stdout.cursorTo(0)
  // process.stdout.write(msg)

  let req = xhr({
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
      'referer': 'https://e-hentai.org/'
    },
    url: image,
    timeout: 5000
  })
  req.on('response', response => {
    if (response.statusCode === 200) {
      switch (response.headers['content-type']) {
        case 'image/jpg':
        case 'image/jpeg':
          let name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
          let dir = path.join(directory, name)

          if (!fs.existsSync(dir)) fs.mkdirSync(dir)
          let fsStream = fs.createWriteStream(`${dir}/${filename}.jpg`)
          req.pipe(fsStream)

          fsStream.on('finish', () => {
            emit.send('DOWNLOAD_WATCH', { index: l, status: `${filename} of ${manga.page}`, finish: (parseInt(manga.page) === index + 1) })
            def.resolve()
            fsStream.close()
          })

          break
        default:
          // console.log(index, '--> ', response.headers['content-type'])
          def.resolve()
          break
      }
    } else {
      // console.log(index, '--> ', response.statusCode, response.headers['content-type'])
      def.resolve()
    }
  })
  req.on('error', err => {
    // process.stdout.cursorTo(msg.length + 1)
    // process.stdout.write(` ${err.message}`)
    if (process.env.NODE_ENV === 'development') {
      console.log(' not found -->', index, err.message)
    }
    let link = manga.items[index]
    manga.items[index] = `${link}${link.indexOf('?') > -1 ? '&' : '?'}nl=${nl}`
    request({ url: manga.items[index] }).then(res => { getImage(res, manga, l, index, def, directory, emit) })
  })
}
em.download = (list, directory, emit) => {
  // let checkpoint = 0
  // checkpoint = new Date()
  // emit('DOWNLOAD_WATCH', {})
  let all = []
  for (let l = 0; l < list.length; l++) {
    let manga = list[l]
    for (let i = 0; i < manga.items.length; i++) {
      // console.log('link:', manga.items[i])
      all.push(() => {
        let def = Q.defer()
        request(manga.items[i]).then(res => { getImage(res, manga, l, i, def, directory, emit) })
        return def.promise
      })
    }
  }

  logs('hentai-downloader', `*downloading request* \`${all.length}\` time`)
  return async.series(all)
}

export const emiter = em
export function init (link) {
  let baseUrl = new URL(link.trim())
  if (baseUrl.hostname === 'exhentai.org') baseUrl.hostname = 'e-hentai.org'
  link = `https://${baseUrl.hostname}${baseUrl.pathname}`

  let getImage = (manga, data) => {
    let links = data.match(/gdtm".*?<a href="(.*?)">/ig)
    for (var i = 0; i < links.length; i++) {
      let link = /gdtm".*?<a href="(.*?)">/i.exec(links[i])[1]
      manga.items.push(link)
    }
  }

  let getManga = res => {
    if (!/DOCTYPE.html.PUBLIC/ig.test(res)) throw new Error(res)

    let fixed = /\/g\/.*?\/.*?\//ig.exec(baseUrl.pathname)
    if (fixed) link = `https://${baseUrl.hostname}${fixed[0]}`

    let name = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(res)
    let language = /Language:.*?class="gdt2">(.*?)&/ig.exec(res)
    let size = /File Size:.*?class="gdt2">(.*?)</ig.exec(res)
    let length = /Length:.*?gdt2">(.*?).page/ig.exec(res)
    let cover = /<div id="gleft">.*?url\((.*?)\)/ig.exec(res)

    let manga = {
      url: link,
      name: name[1],
      cover: cover[1],
      language: language[1],
      size: size[1],
      page: length[1],
      items: []
    }

    if (!manga.name) throw new Error('manga.name is not found')
    if (!manga.language) throw new Error('manga.language is not found')
    if (!manga.size) throw new Error('manga.size is not found')
    if (!manga.page) throw new Error('manga.page is not found')

    slack(baseUrl.host, manga)

    getImage(manga, res)
    if (manga.items.length !== manga.page) {
      let all = []
      for (let i = 1; i < Math.ceil(manga.page / manga.items.length); i++) {
        all.push(() => request(`${link}?p=${i}`).then((res) => getImage(manga, res)))
      }
      return async.series(all).then(() => {
        if (manga.items.length !== parseInt(manga.page)) throw new Error(`manga.items is '${manga.items.length}' and length is '${manga.page}'`)
        return manga
      })
    } else {
      return manga
    }
  }

  console.log('URL', `${link}`)
  return (() => {
    let def = Q.defer()
    if (!/g\/\d+?\/[a-f0-9]{10}\//ig.test(baseUrl.pathname)) {
      def.reject(new Error(`Key missing, or incorrect key provided.`))
    } else {
      def.resolve()
    }
    return def.promise
  })().then(() => {
    return request({
      url: link,
      header: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'referer': 'https://e-hentai.org/',
        'upgrade-insecure-requests': '1'
      }
    })
  }).then(getManga).catch(ex => {
    if (ex.statusCode === 404) {
      if (ex.error) {
        if (baseUrl.hostname === 'e-hentai.org') baseUrl.hostname = 'exhentai.org'
        logs('hentai-downloader', `*rare*: https://${baseUrl.hostname}${baseUrl.pathname}`)
        throw new Error('This gallery has been removed or is unavailable.')
      } else {
        logs('hentai-downloader', `*error*: ${link}\n${ex.name.toString()}`)
        throw new Error(ex.name)
      }
    } else {
      logs('hentai-downloader', `*error*: ${link}\n${ex.toString()}`)
      throw ex
    }
  })
}
