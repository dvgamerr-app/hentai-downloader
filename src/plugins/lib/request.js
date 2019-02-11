import { setCookie, getCookie } from './cookie'

const xhr = require('request-ssl')

xhr.addFingerprint('forums.e-hentai.org', 'FD:2C:52:EF:D8:67:EC:B3:E7:99:46:C6:96:68:53:6A:39:64:6B:F9')
xhr.addFingerprint('e-hentai.org', '40:6B:8C:E8:B0:FE:F5:50:DE:94:6B:35:D3:71:A9:89:23:ED:55:25')
xhr.addFingerprint('exhentai.org', '21:E2:AC:AA:2D:EB:32:F0:2D:39:13:8A:97:F6:78:23:D9:A5:8C:8E')

export default async (method = 'GET', uri = '', data = {}, addHeaders = {}) => {
  uri = uri.trim().replace(/&amp;/g, '&')
  let base = new URL(uri)
  let referer = `https://${base.hostname}/`
  console.log(` - [exhentai] ${method}:${uri}`)
  let httpHeaders = Object.assign({
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,ru;q=0.5,zh-TW;q=0.4,zh;q=0.3',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    ':authority': base.hostname,
    ':scheme': 'https',
    'referer': referer
  }, addHeaders)
  let request = xhr.defaults({ timeout: 5000, jar: getCookie() })

  return new Promise((resolve, reject) => {
    const callback = (error, res, body) => {
      if (error) {
        console.log(` - [exhentai] response error:`, error)
        return reject(error)
      }
      const { statusCode, headers } = res
      console.log(` - [exhentai] response code: ${statusCode} body: ${body.length} length`)
      if (([ 200, 302 ]).indexOf(statusCode) < 0) return reject(statusCode)

      setCookie(referer, headers)
      resolve(body)
    }

    const options = {
      url: uri,
      method: method,
      header: httpHeaders,
      formData: data
    }
    request(options, callback)
  })
}
