import request from '../lib/request'

export default async (uri) => {
  try {
    uri = uri instanceof URL ? uri : new URL(uri.trim().replace(/&amp;/g, '&'))

    if (!/\/\w{1}\/\d{1,8}\/[0-9a-f]+?\//ig.test(uri.pathname)) throw new Error(`Key missing, or incorrect key provided.`)
    if (/^ex/i.test(uri.hostname) && global._appToken.name) throw new Error(`Session not login.`)

    let html = await request('GET', uri.toString())
    if (!/DOCTYPE.html.PUBLIC/ig.test(html)) throw new Error(html)
    let [ , warnMe ] = /<a href="(.*?)">Never Warn Me Again/ig.exec(html) || []
    if (warnMe) {
      // throw new Error('Never Warn Me Again')
      html = await request('GET', warnMe[1], {}, { 'referer': `${uri.protocol}//${uri.hostname}` })
    }
    return html
  } catch (ex) {
    if (ex.statusCode === 404) {
      if (ex.error) {
        // logs('hentai-downloader', `*rare*: https://${uri.hostname}${uri.pathname}`)
        throw new Error('This gallery has been removed or is unavailable.')
      } else {
        // logs('hentai-downloader', `*error*: ${link}\n${ex.name.toString()}`)
        throw new Error(ex.name)
      }
    } else {
      // logs('hentai-downloader', `*error*: ${link}\n${ex.toString()}`)
      throw ex
    }
  }
}
