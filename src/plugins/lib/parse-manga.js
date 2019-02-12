import parseImage from './parse-image'

export default (uri, html) => {
  uri = uri instanceof URL ? uri : new URL(uri.trim().replace(/&amp;/g, '&'))
  const [ , gallery ] = /\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.exec(uri.pathname) || []
  uri = new URL(`${uri.protocol}//${uri.hostname}${gallery}`)

  const [ , name ] = /<div id="gd2">.*?gn">(.*?)<\/.*?gj">(.*?)<\/.*?<\/div>/ig.exec(html) || []
  const [ , language ] = /Language:.*?class="gdt2">(.*?)&/ig.exec(html) || []
  const [ , size ] = /File Size:.*?class="gdt2">(.*?)</ig.exec(html) || []
  const [ , length ] = /Length:.*?gdt2">(.*?).page/ig.exec(html) || []
  const [ , cover ] = /<div id="gleft">.*?url\((.*?)\)/ig.exec(html) || []

  if (!name) throw new Error('manga.name is undefined.')
  if (!language) throw new Error('manga.language is undefined.')
  if (!size) throw new Error('manga.size is undefined.')
  if (!length) throw new Error('manga.page is undefined.')
  if (!cover) throw new Error('manga.cover is undefined.')

  return {
    ref: gallery,
    url: uri.toString(),
    name: name.trim(),
    cover: cover.trim(),
    language: language.trim(),
    size: size.trim(),
    page: length.trim(),
    items: parseImage(html)
  }
  // // let config = settings.get('config')
  // // exHentaiHistory('exhentai/manga', {
  // //   user_id: config.user_id,
  // //   name: manga.name,
  // //   link: manga.url,
  // //   cover: manga.cover,
  // //   language: manga.language,
  // //   size: manga.size,
  // //   page: manga.page
  // // })
  // // slack(baseUrl.host, manga)
  // getImage(manga, res)
  // console.log(manga)
  // let totalPage = Math.ceil(manga.page / manga.items.length)
  // emit.send('INIT_MANGA', { page: 1, total: totalPage })
  // if (manga.items.length !== manga.page) {
  //   let all = []
  //   for (let i = 1; i < totalPage; i++) {
  //     all.push(() => {
  //       emit.send('INIT_MANGA', { page: i + 1, total: totalPage })
  //       return request(`${link}?p=${i}`).then((res) => getImage(manga, res))
  //     })
  //   }
  //   return async.series(all).then(() => {
  //     // request({
  //     //   url: link,
  //     //   header: {
  //     //     'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
  //     //     'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  //     //     'accept-language': 'th-TH,th;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2',
  //     //     'cache-control': 'no-cache',
  //     //     'pragma': 'no-cache',
  //     //     'referer': `https://${baseUrl.hostname}/`,
  //     //     'upgrade-insecure-requests': '1'
  //     //   }
  //     // })
  //     if (manga.items.length !== parseInt(manga.page)) throw new Error(`manga.items is '${manga.items.length}' and length is '${manga.page}'`)
  //     return manga
  //   }).then(() => {
  //     return exHentaiHistory('/exhentai', {})
  //   })
  // } else {
  //   exHentaiHistory('/exhentai', {})
  //   return manga
  // }
}
