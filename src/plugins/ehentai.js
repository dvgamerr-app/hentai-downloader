import { debuger } from '@touno-io/debuger'
// import settings from 'electron-settings'
import getGallery from './ex/gallery'
import parseManga from './lib/parse-manga'
import parseImage from './lib/parse-image'

// const touno = require('./config')
// const fs = require('fs')
// const path = require('path')
const async = require('async-q')
// const Q = require('q')
const events = require('events')
const em = new events.EventEmitter()
const { powerSaveBlocker } = require('electron')

let saveBlockerId = null

// let allCookie = []
// const jarCookieSession = () => allCookie.map(cookie => cookie.split(';')[0]).join('; ')

// const exHentaiHistory = (url, data) => {
//   console.log('hentail-app:', url, data)
//   // return touno.api({ url, data })
// }

// let getFilename = (index, total) => {
//   return `${Math.pow(10, (total.toString().length - index.toString().length) + 1).toString().substr(2, 10) + index}`
// }

// let getImage = (res, manga, l, index, def, directory, emit) => {
//   let image = /id="img".*?src="(.*?)"/ig.exec(res)[1]
//   let nl = /return nl\('(.*?)'\)/ig.exec(res)[1]
//   let filename = getFilename(index + 1, manga.page)

//   emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page), finish: false, error: false })
//   let msg = `Downloading...  -- '${(index + 1)}.jpg' of ${manga.page} files -->`
//   logs(msg)

//   let req = xhr({
//     method: 'GET',
//     headers: {
//       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
//       'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
//       'Accept-Encoding': 'gzip, deflate',
//       'Accept-Language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
//       'referer': 'https://e-hentai.org/'
//     },
//     url: image,
//     timeout: 5000
//   })
//   req.on('response', response => {
//     if (response.statusCode === 200) {
//       let extensions = null
//       switch (response.headers['content-type']) {
//         case 'image/jpg':
//         case 'image/jpeg':
//           extensions = 'jpg'
//           break
//         case 'image/png':
//           extensions = 'png'
//           break
//         case 'image/gif':
//           extensions = 'gif'
//           break
//       }
//       if (extensions) {
//         let name = manga.name.replace(/[/\\|.:?<>"]/ig, '')
//         let dir = path.join(directory, name)

//         if (!fs.existsSync(dir)) fs.mkdirSync(dir)
//         let fsStream = fs.createWriteStream(`${dir}/${filename}.${extensions}`)
//         req.pipe(fsStream)

//         fsStream.on('finish', () => {
//           let success = parseInt(manga.page) === index + 1
//           emit.send('DOWNLOAD_WATCH', { index: l, current: filename, total: parseInt(manga.page), finish: success })
//           if (success) {
//             let config = settings.get('config')
//             let data = {
//               user_id: config.user_id,
//               name: manga.name,
//               link: manga.url,
//               cover: manga.cover,
//               language: manga.language,
//               size: manga.size,
//               page: manga.page,
//               completed: true
//             }
//             exHentaiHistory('exhentai/manga', data)
//             return def.resolve(data)
//           }
//           def.resolve()
//           fsStream.close()
//         })
//       } else {
//         def.resolve()
//       }
//     } else {
//       // logs(index, '--> ', response.statusCode, response.headers['content-type'])
//       def.resolve()
//     }
//   })
//   req.on('error', err => {
//     // process.stdout.cursorTo(msg.length + 1)
//     // logs(` ${err.message}`)
//     if (process.env.NODE_ENV === 'development') {
//       logs(' not found -->', index, err.message)
//     }
//     let link = manga.items[index]
//     manga.items[index] = `${link}${link.indexOf('?') > -1 ? '&' : '?'}nl=${nl}`
//     request({ url: manga.items[index] }).then(res => getImage(res, manga, l, index, def, directory, emit))
//   })
//  }
em.download = (list, directory, emit) => {
  saveBlockerId = powerSaveBlocker.start('prevent-display-sleep')

  let all = []
  for (let l = 0; l < list.length; l++) {
    let manga = list[l]
    if (manga.error) continue
    for (let i = 0; i < manga.items.length; i++) {
      all.push(() => {
        // let def = Q.defer()
        // request(manga.items[i]).then(async res => {
        //   getImage(res, manga, l, i, def, directory, emit)
        // })
        // return def.promise
      })
    }
  }

  // logs('hentai-downloader', `*downloading request* \`${all.length}\` time`)
  return async.series(all).then(() => {
    if (powerSaveBlocker.isStarted(saveBlockerId)) powerSaveBlocker.stop(saveBlockerId)
    saveBlockerId = null
  }).catch(ex => {
    if (powerSaveBlocker.isStarted(saveBlockerId)) powerSaveBlocker.stop(saveBlockerId)
    saveBlockerId = null
  })
}

export const emiter = em

export async function prepareManga (link, emit) {
  const logger = debuger.scope('init')
  emit.send('INIT_MANGA', { page: 0, total: 1 })
  logger.log(`manga-init: ${link}`)
  let html = await getGallery(link)
  logger.log(`- parse html raw.`)
  let manga = parseManga(link, html)

  const totalPage = Math.ceil(manga.page / manga.items.length)
  logger.log(`- page: ${totalPage} item: ${manga.items.length}`)

  emit.send('INIT_MANGA', { page: 1, total: totalPage })

  if (manga.items.length < parseInt(manga.page)) {
    for (let i = 1; i < totalPage; i++) {
      logger.log(`manga-next: ${manga.url}?p=${i}`)
      emit.send('INIT_MANGA', { page: i + 1, total: totalPage })
      html = await getGallery(`${manga.url}?p=${i}`)
      manga.items = manga.items.concat(parseImage(html))
    }
    if (manga.items.length !== parseInt(manga.page)) throw new Error(`manga fetch is '${manga.items.length}' but show is '${manga.page}'.`)
  }
  // exHentaiHistory('/exhentai', {})
  return manga
}
